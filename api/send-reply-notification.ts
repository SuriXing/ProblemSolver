/**
 * Vercel serverless function: send the email notification when a reply lands.
 *
 * Called by the `replies_notify_owner` DB trigger (2026_08_19 migration) via
 * pg_net. Uses Resend (https://resend.com) to deliver email.
 *
 * ---------------------------------------------------------------------------
 * S3.3 hardening (2026-08): trigger-only contract
 * ---------------------------------------------------------------------------
 * The S3.1-era handler was built for a caller that never actually shipped:
 * the browser, after DatabaseService.createReply(). Its trust model was an
 * Origin allowlist PLUS a caller-supplied recipient email — mitigated, but
 * still trusting the request for WHO gets emailed.
 *
 * With the trigger landing, the caller class is exactly one: our own
 * database. The redesign removes the browser path entirely:
 *
 *   1. **Shared-secret gate** — `X-Trigger-Secret` must equal the
 *      NOTIFICATION_TRIGGER_SECRET env, provisioned on the DB side via
 *      ALTER DATABASE ... SET app.notification_trigger_secret (same pattern
 *      as app.rate_limit_ip_salt). Missing env fails closed (500); wrong or
 *      missing secret is 403. There is no Origin/Referer parsing anywhere —
 *      a browser caller can't even reach the relay, so the S3.1 open-relay
 *      shape is gone rather than mitigated.
 *
 *   2. **Recipient is trigger-supplied** — the trigger already read
 *      `post_notifications` in SQL (PII-closed table, no anon grants) and
 *      chose the recipient server-side. The request can't nominate an
 *      address anymore; this handler only format-checks it.
 *
 *   3. **Per-recipient LRU kept, per-IP LRU dropped** — every trigger call
 *      now shares Supabase's pg_net egress IP, so a per-IP bucket would be
 *      one shared false-positive across all users. Reply INSERTs are already
 *      throttled server-side upstream; the recipient cap (5 / 10 min) stays
 *      as the real flood bound.
 *
 *   4. **Length caps** — unchanged: recipient/post/reply hard-bounded BEFORE
 *      the Resend call, so even a compromised trigger can't relay 10MB.
 *
 *   5. **html-escaper package** instead of hand-rolled escaping — unchanged.
 *
 * ---------------------------------------------------------------------------
 * Env vars
 * ---------------------------------------------------------------------------
 *   NOTIFICATION_TRIGGER_SECRET — required. Shared with the DB via
 *                           ALTER DATABASE ... SET
 *                           app.notification_trigger_secret. If missing the
 *                           handler returns 500 — fail closed.
 *   RESEND_API_KEY        — required for real send. Free 3k/mo at resend.com.
 *                           If missing, handler returns 200 { sent: false,
 *                           reason: 'no_api_key' } so dev/preview don't break.
 *   APP_BASE_URL          — optional link target in the email footer.
 *                           Defaults to https://anoncafe.life.
 *   RESEND_FROM_ADDRESS   — optional From: header. Defaults to Resend's
 *                           shared sandbox onboarding@resend.dev.
 *
 * ---------------------------------------------------------------------------
 * Runtime
 * ---------------------------------------------------------------------------
 * Vercel auto-deploys this as a Node.js serverless function (Fluid Compute
 * default). In local `npm run dev` (pure Vite) this route is NOT served —
 * use `vercel dev` to test the real handler.
 */

import { escape as htmlEscape } from 'html-escaper';

type ReqBody = {
  email?: string;
  postId?: string;
  accessCode?: string;
  postContent?: string;
  replyContent?: string;
  locale?: string;
};

// ---------------------------------------------------------------------------
// Email copy per locale. The opt-in records the owner's browser language
// (post_notifications.locale, validated server-side); the trigger forwards
// it and this map renders the subject + body in that language. Unknown or
// missing locale falls back to en — the only locale the DB guarantees.
// ---------------------------------------------------------------------------
type EmailCopy = {
  subject: string;
  intro: string;
  echo: string;
  link: string;
  footer: string;
};

const EN_COPY: EmailCopy = {
  subject: 'Someone replied to your post',
  intro: 'Someone replied to your post.',
  echo: 'on your post: ',
  link: 'Open the reply',
  footer: 'You asked for an email when someone replied. One email per reply, nothing else.',
};

const EMAIL_COPY: Record<string, EmailCopy> = {
  en: EN_COPY,
  'zh-CN': {
    subject: '有人回复了你的帖子',
    intro: '有人回复了你的帖子。',
    echo: '你的帖子：',
    link: '查看回复',
    footer: '你选择了有人回复时收到邮件。每条回复一封，没有别的。',
  },
  ja: {
    subject: '投稿に返信がありました',
    intro: '投稿に返信がありました。',
    echo: 'あなたの投稿：',
    link: '返信を開く',
    footer: '返信があったときにメールを受け取るよう設定しました。返信ごとに1通、それだけです。',
  },
  ko: {
    subject: '게시물에 답글이 달렸습니다',
    intro: '게시물에 답글이 달렸습니다.',
    echo: '내 게시물: ',
    link: '답글 열기',
    footer: '답글이 달리면 이메일을 받기로 설정했습니다. 답글당 한 통뿐입니다.',
  },
  es: {
    subject: 'Alguien respondió a tu publicación',
    intro: 'Alguien respondió a tu publicación.',
    echo: 'tu publicación: ',
    link: 'Abrir la respuesta',
    footer: 'Pediste un email cuando alguien respondiera. Un email por respuesta, nada más.',
  },
};

// The locale is a display hint from our own trigger — never a trust decision
// and never worth an email. Anything malformed absorbs to the en copy.
function resolveCopy(raw: unknown): EmailCopy {
  const locale = typeof raw === 'string' && /^[a-zA-Z]{2}(-[a-zA-Z]{2,4})?$/.test(raw) ? raw : 'en';
  return EMAIL_COPY[locale] ?? EN_COPY;
}

// ---------------------------------------------------------------------------
// Length caps — applied BEFORE we call Resend. The point isn't to validate
// "real" input, it's to refuse the worst-case "I POST 10MB of garbage and
// you relay it" exploit. These are generous for legitimate replies and
// strict against abuse.
// ---------------------------------------------------------------------------
const MAX_EMAIL_LEN = 254;        // RFC 5321 max
const MAX_POST_LEN = 2_000;
const MAX_REPLY_LEN = 5_000;
const MAX_ACCESS_CODE_LEN = 64;
const MAX_POST_ID_LEN = 64;

// ---------------------------------------------------------------------------
// Rate limiter — process-local LRU. Two independent buckets:
//   recipient → drops to 5 / WINDOW_MS regardless of who sent it
//   ip        → drops to 30 / WINDOW_MS regardless of who they emailed
// Either limit triggers a 429.
//
// The Map grows unbounded over the lifetime of an instance, so we evict
// entries whose most recent timestamp is older than WINDOW_MS on each call.
// At ~30 RPS sustained that's an O(n) sweep over a few hundred entries —
// trivial. If this endpoint ever sees real volume, replace with an LRU
// library + Vercel KV.
// ---------------------------------------------------------------------------
const WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const PER_RECIPIENT_LIMIT = 5;

type Bucket = Map<string, number[]>;
const recipientBucket: Bucket = new Map();

function rateLimitHit(bucket: Bucket, key: string, limit: number, now: number): boolean {
  // Evict global stale entries cheaply (only when the bucket grows past 500).
  if (bucket.size > 500) {
    for (const [k, ts] of bucket) {
      const last = ts.length ? (ts[ts.length - 1] ?? 0) : 0;
      if (now - last > WINDOW_MS) bucket.delete(k);
    }
  }
  const arr = bucket.get(key) ?? [];
  // Drop entries outside the rolling window.
  const fresh = arr.filter((t) => now - t < WINDOW_MS);
  if (fresh.length >= limit) {
    bucket.set(key, fresh); // persist the trim so the bucket doesn't grow
    return true;
  }
  fresh.push(now);
  bucket.set(key, fresh);
  return false;
}

/** Test-only: clear in-memory rate buckets between specs. */
export function __resetRateLimits(): void {
  recipientBucket.clear();
}

// ---------------------------------------------------------------------------
// Header extraction — req.headers may be a Headers object or a plain dict
// depending on runtime. Normalize.
// ---------------------------------------------------------------------------
function header(req: any, name: string): string | undefined {
  const h = req.headers;
  if (!h) return undefined;
  const v = typeof h.get === 'function' ? h.get(name) : h[name] ?? h[name.toLowerCase()];
  return typeof v === 'string' ? v : undefined;
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  // -----------------------------------------------------------------------
  // 1. Shared-secret gate — fail closed if the env is unset. No Origin
  //    parsing anywhere: the only accepted caller is the DB trigger.
  // -----------------------------------------------------------------------
  const triggerSecret = process.env.NOTIFICATION_TRIGGER_SECRET;
  if (!triggerSecret) {
    console.error('[email] NOTIFICATION_TRIGGER_SECRET env not set — refusing to serve.');
    res.status(500).json({ sent: false, reason: 'misconfigured' });
    return;
  }
  if (header(req, 'x-trigger-secret') !== triggerSecret) {
    res.status(403).json({ sent: false, reason: 'forbidden' });
    return;
  }

  // The view link in the email footer. Not a trust decision anymore — the
  // only trusted caller authenticated itself with the secret above.
  const appBaseUrl = (process.env.APP_BASE_URL || 'https://anoncafe.life').replace(/\/+$/, '');

  // -----------------------------------------------------------------------
  // 2. Body parse + field validation
  // -----------------------------------------------------------------------
  const body: ReqBody =
    typeof req.body === 'string' ? safeParseJson(req.body) : req.body || {};
  const { email, postId, accessCode, postContent, replyContent, locale } = body;

  if (!email || !replyContent) {
    res.status(400).json({ error: 'Missing required fields: email, replyContent' });
    return;
  }
  if (typeof email !== 'string' || typeof replyContent !== 'string') {
    res.status(400).json({ error: 'Invalid field types' });
    return;
  }
  if (email.length > MAX_EMAIL_LEN || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: 'Invalid email' });
    return;
  }
  if (replyContent.length > MAX_REPLY_LEN) {
    res.status(400).json({ error: 'replyContent too long' });
    return;
  }
  if (postContent && (typeof postContent !== 'string' || postContent.length > MAX_POST_LEN)) {
    res.status(400).json({ error: 'postContent invalid or too long' });
    return;
  }
  if (accessCode && (typeof accessCode !== 'string' || accessCode.length > MAX_ACCESS_CODE_LEN)) {
    res.status(400).json({ error: 'accessCode invalid' });
    return;
  }
  if (postId && (typeof postId !== 'string' || postId.length > MAX_POST_ID_LEN)) {
    res.status(400).json({ error: 'postId invalid' });
    return;
  }
  // locale is never rejected: resolveCopy() absorbs anything malformed to the
  // en copy, so a display hint can't cost the email itself.

  // -----------------------------------------------------------------------
  // 3. Rate limit — recipient first (the spam target). The old per-IP axis
  //    is gone: trigger calls share Supabase's egress IP, so that bucket
  //    would be one shared false-positive across all users.
  // -----------------------------------------------------------------------
  const now = Date.now();
  const recipientKey = email.toLowerCase();
  if (rateLimitHit(recipientBucket, recipientKey, PER_RECIPIENT_LIMIT, now)) {
    res.status(429).json({ sent: false, reason: 'rate_limit_recipient' });
    return;
  }

  // -----------------------------------------------------------------------
  // 4. Send (or stub if no API key)
  // -----------------------------------------------------------------------
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log(
      `[email] RESEND_API_KEY not set — skipping real send.\n` +
        `         Would have emailed: ${email}\n` +
        `         Subject: Someone replied to your post\n` +
        `         Post ID: ${postId}`
    );
    res.status(200).json({ sent: false, reason: 'no_api_key' });
    return;
  }

  const fromAddress = process.env.RESEND_FROM_ADDRESS || 'onboarding@resend.dev';
  const viewUrl = accessCode
    ? `${appBaseUrl}/#/past-questions?code=${encodeURIComponent(accessCode)}`
    : appBaseUrl;
  const copy = resolveCopy(locale);

  const postEcho = postContent
    ? `<p style="margin: 0 0 20px; font-size: 13px; color: #737373;">${htmlEscape(
        copy.echo,
      )}${htmlEscape(truncate(postContent.replace(/\s+/g, ' ').trim(), 90))}</p>`
    : '';
  const replySnippet = truncate(replyContent, 400);

  // Text-first notification: no emoji, no colored info cards, no button.
  // The reply quote is the email; everything else stays out of its way.
  const htmlBody = `
<div style="font-family: -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 36px 24px; font-size: 15px; line-height: 1.65; color: #1f1f1f;">
  <p style="margin: 0 0 20px;">${htmlEscape(copy.intro)}</p>
  ${postEcho}
  <blockquote style="margin: 0 0 24px; padding: 2px 16px; border-left: 2px solid #d4d4d4; white-space: pre-wrap;">${htmlEscape(
    replySnippet,
  )}</blockquote>
  <p style="margin: 0;">
    <a href="${htmlEscape(viewUrl)}" style="color: #1f1f1f; text-decoration: underline;">${htmlEscape(copy.link)}</a>
  </p>
  <p style="margin: 32px 0 0; padding-top: 14px; border-top: 1px solid #ececec; font-size: 12px; line-height: 1.55; color: #a3a3a3;">
    ${htmlEscape(copy.footer)}<br>
    Anon Cafe
  </p>
</div>`;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `Anon Cafe <${fromAddress}>`,
        to: [email],
        subject: copy.subject,
        html: htmlBody,
      }),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      console.error('[email] Resend API error:', response.status, errText);
      res.status(502).json({ sent: false, reason: 'resend_error', status: response.status });
      return;
    }

    const data = (await response.json().catch(() => ({}))) as { id?: unknown };
    res.status(200).json({ sent: true, id: data.id ?? null });
  } catch (err) {
    console.error('[email] Unexpected error sending email:', err);
    // Do NOT echo err back to caller — could leak internal hostnames,
    // package paths, or stack frames. Reason code is enough.
    res.status(500).json({ sent: false, reason: 'exception' });
  }
}

function safeParseJson(s: string): ReqBody {
  try {
    return JSON.parse(s);
  } catch {
    return {};
  }
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max - 3) + '...';
}
