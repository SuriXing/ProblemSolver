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
};

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
  const { email, postId, accessCode, postContent, replyContent } = body;

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

  const postSnippet = truncate(postContent || '(your post)', 200);
  const replySnippet = truncate(replyContent, 400);

  const htmlBody = `
    <div style="font-family: -apple-system, Segoe UI, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #222;">
      <h2 style="margin: 0 0 16px; color: #4f7cff;">Someone replied to your post 💬</h2>
      <p style="margin: 0 0 12px; color: #555;">You asked for help, and someone from the community took the time to respond.</p>

      <div style="background: #f8f9fb; border-left: 3px solid #4f7cff; padding: 12px 16px; margin: 16px 0; border-radius: 4px;">
        <div style="font-size: 12px; color: #888; margin-bottom: 4px;">Your original post:</div>
        <div style="color: #333; white-space: pre-wrap;">${htmlEscape(postSnippet)}</div>
      </div>

      <div style="background: #eef2ff; border-left: 3px solid #52c41a; padding: 12px 16px; margin: 16px 0; border-radius: 4px;">
        <div style="font-size: 12px; color: #52c41a; font-weight: 600; margin-bottom: 4px;">New reply:</div>
        <div style="color: #222; white-space: pre-wrap;">${htmlEscape(replySnippet)}</div>
      </div>

      <p style="margin: 24px 0 8px;">
        <a href="${htmlEscape(viewUrl)}" style="display: inline-block; background: #4f7cff; color: #fff; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: 500;">View the full reply</a>
      </p>
      <p style="font-size: 12px; color: #999; margin-top: 24px;">
        You're receiving this because you opted into email notifications when you submitted your post on Problem Solver.
      </p>
    </div>
  `;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `Problem Solver <${fromAddress}>`,
        to: [email],
        subject: 'Someone replied to your post',
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
