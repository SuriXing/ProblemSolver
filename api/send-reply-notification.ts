/**
 * Vercel serverless function: send email notification when a reply is posted.
 *
 * Called by DatabaseService.createReply() after a successful reply insert.
 * Uses Resend (https://resend.com) to deliver email.
 *
 * ---------------------------------------------------------------------------
 * S3.1 hardening (2026-04-20)
 * ---------------------------------------------------------------------------
 * The pre-S3.1 handler was an open relay: any internet caller could POST a
 * recipient + arbitrary HTML-escaped body and Resend would deliver it on our
 * project's quota and From: domain. With the free tier at 3k emails/month and
 * Resend reputation tied to the From: domain, that's both a billing-DoS and
 * a phishing/spam vector that would burn our sender reputation.
 *
 * Mitigations layered here:
 *
 *   1. **Origin allowlist** — `APP_BASE_URL` env (e.g. https://problem-solver.app)
 *      is the ONLY accepted Origin. Requests with no Origin or a different
 *      Origin are rejected 403. This blocks the trivial `curl` open-relay.
 *      Note: Origin can be spoofed by a non-browser client, so this is one
 *      layer of defense, not the whole fence — combined with rate limiting
 *      below, the practical exploit cost goes way up.
 *
 *   2. **Dual-axis in-memory LRU rate limit** — capped at:
 *        - 5 emails per recipient address per 10 min
 *        - 30 emails per source IP per 10 min
 *      Bucket is process-local (fine on Vercel — each instance shares a
 *      bucket and instances are reused via Fluid Compute). Across cold-start
 *      churn, a determined attacker still hits the recipient cap because
 *      that key is the email itself.
 *
 *   3. **Length caps** — recipient/post/reply hard-bounded BEFORE the
 *      Resend call. Prevents a 10MB POST from being relayed verbatim.
 *
 *   4. **html-escaper package** instead of hand-rolled escaping — fewer
 *      bugs around named-vs-numeric entities and surrogate pairs.
 *
 * Why no JWT bearer auth: the caller (`DatabaseService.createReply`) runs
 * for ANONYMOUS users (no login required to post a reply on this app). There
 * is no JWT to forward. The caller IS already gated by Supabase RLS for the
 * actual reply insert; this notification endpoint is best-effort UX. If/when
 * we add auth to replies, add `Authorization: Bearer <jwt>` here and verify
 * via supabase.auth.getUser().
 *
 * ---------------------------------------------------------------------------
 * Env vars
 * ---------------------------------------------------------------------------
 *   RESEND_API_KEY        — required for real send. Free 3k/mo at resend.com.
 *                           If missing, handler returns 200 { sent: false,
 *                           reason: 'no_api_key' } so dev/preview don't break.
 *   APP_BASE_URL          — required for the Origin allowlist (e.g.
 *                           https://problem-solver.app). If missing the
 *                           handler returns 500 — fail closed, do NOT silently
 *                           accept all origins.
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
const PER_IP_LIMIT = 30;

type Bucket = Map<string, number[]>;
const recipientBucket: Bucket = new Map();
const ipBucket: Bucket = new Map();

function rateLimitHit(bucket: Bucket, key: string, limit: number, now: number): boolean {
  // Evict global stale entries cheaply (only when the bucket grows past 500).
  if (bucket.size > 500) {
    for (const [k, ts] of bucket) {
      const last = ts.length ? ts[ts.length - 1] : 0;
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
  ipBucket.clear();
}

// ---------------------------------------------------------------------------
// Origin extraction — Vercel sets x-forwarded-for; req.headers may be a
// Headers object or a plain dict depending on runtime. Normalize.
// ---------------------------------------------------------------------------
function header(req: any, name: string): string | undefined {
  const h = req.headers;
  if (!h) return undefined;
  const v = typeof h.get === 'function' ? h.get(name) : h[name] ?? h[name.toLowerCase()];
  return typeof v === 'string' ? v : undefined;
}

function clientIp(req: any): string {
  // ON VERCEL: prefer `x-vercel-forwarded-for` (set by the edge proxy, not
  // settable from the client). Falling back to the RIGHTMOST entry in
  // x-forwarded-for, because Vercel APPENDS the real client IP rather than
  // replacing — the leftmost is whatever the attacker put there.
  // (S3.2 round 1 finding: trusting leftmost XFF made the IP rate limit a
  // free bypass — attacker rotates the header per request → fresh bucket.)
  const vercel = header(req, 'x-vercel-forwarded-for');
  if (vercel) {
    const parts = vercel.split(',');
    const last = parts[parts.length - 1];
    if (last) return last.trim();
  }
  const xff = header(req, 'x-forwarded-for');
  if (xff) {
    const parts = xff.split(',');
    const last = parts[parts.length - 1];
    if (last) return last.trim();
  }
  return header(req, 'x-real-ip') || (req.socket?.remoteAddress as string) || 'unknown';
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  // -----------------------------------------------------------------------
  // 1. Origin allowlist — fail closed if APP_BASE_URL is unset.
  // -----------------------------------------------------------------------
  const appBaseUrl = process.env.APP_BASE_URL;
  if (!appBaseUrl) {
    console.error('[email] APP_BASE_URL env not set — refusing to serve.');
    res.status(500).json({ sent: false, reason: 'misconfigured' });
    return;
  }
  const expectedOrigin = appBaseUrl.replace(/\/+$/, '');
  const origin = header(req, 'origin');
  if (!origin || origin.replace(/\/+$/, '') !== expectedOrigin) {
    res.status(403).json({ sent: false, reason: 'forbidden_origin' });
    return;
  }

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
  // 3. Rate limit — recipient first (the spam target), then IP.
  // -----------------------------------------------------------------------
  const now = Date.now();
  const recipientKey = email.toLowerCase();
  const ipKey = clientIp(req);
  if (rateLimitHit(recipientBucket, recipientKey, PER_RECIPIENT_LIMIT, now)) {
    res.status(429).json({ sent: false, reason: 'rate_limit_recipient' });
    return;
  }
  if (rateLimitHit(ipBucket, ipKey, PER_IP_LIMIT, now)) {
    res.status(429).json({ sent: false, reason: 'rate_limit_ip' });
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
    ? `${expectedOrigin}/#/past-questions?code=${encodeURIComponent(accessCode)}`
    : expectedOrigin;

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

    const data = await response.json().catch(() => ({}));
    res.status(200).json({ sent: true, id: data.id });
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
