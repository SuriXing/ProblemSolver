/**
 * Vercel serverless function: send email notification when a reply is posted.
 *
 * Called by DatabaseService.createReply() after a successful reply insert.
 * Uses Resend (https://resend.com) to deliver email.
 *
 * Required env var:
 *   RESEND_API_KEY — get one free at https://resend.com/api-keys
 *                    (3k emails/month free, no credit card required)
 *
 * Optional env var:
 *   RESEND_FROM_ADDRESS — the "From:" address. Defaults to
 *                         onboarding@resend.dev (Resend's shared sandbox).
 *                         For production, verify your own domain and use
 *                         e.g. noreply@yourdomain.com.
 *
 * If RESEND_API_KEY is not set, the handler responds 200 with
 * { sent: false, reason: 'no_api_key' } — this lets local dev and
 * unconfigured deployments work without throwing errors.
 *
 * IMPORTANT: This file lives in /api/ at the repo root. Vercel auto-deploys
 * it as a Node.js serverless function. In local `npm run dev` (pure Vite),
 * this route is NOT served — the client-side fetch will fail silently and
 * log a message. To test locally with the real handler, run `vercel dev`.
 */

type ReqBody = {
  email?: string;
  postId?: string;
  accessCode?: string;
  postContent?: string;
  replyContent?: string;
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const body: ReqBody =
    typeof req.body === 'string' ? safeParseJson(req.body) : req.body || {};
  const { email, postId, accessCode, postContent, replyContent } = body;

  if (!email || !replyContent) {
    res.status(400).json({ error: 'Missing required fields: email, replyContent' });
    return;
  }

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
  const appOrigin = (req.headers.origin as string) || 'http://localhost:3000';
  const viewUrl = accessCode
    ? `${appOrigin}/#/past-questions?code=${encodeURIComponent(accessCode)}`
    : appOrigin;

  const postSnippet = truncate(postContent || '(your post)', 200);
  const replySnippet = truncate(replyContent, 400);

  const htmlBody = `
    <div style="font-family: -apple-system, Segoe UI, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #222;">
      <h2 style="margin: 0 0 16px; color: #4f7cff;">Someone replied to your post 💬</h2>
      <p style="margin: 0 0 12px; color: #555;">You asked for help, and someone from the community took the time to respond.</p>

      <div style="background: #f8f9fb; border-left: 3px solid #4f7cff; padding: 12px 16px; margin: 16px 0; border-radius: 4px;">
        <div style="font-size: 12px; color: #888; margin-bottom: 4px;">Your original post:</div>
        <div style="color: #333; white-space: pre-wrap;">${escapeHtml(postSnippet)}</div>
      </div>

      <div style="background: #eef2ff; border-left: 3px solid #52c41a; padding: 12px 16px; margin: 16px 0; border-radius: 4px;">
        <div style="font-size: 12px; color: #52c41a; font-weight: 600; margin-bottom: 4px;">New reply:</div>
        <div style="color: #222; white-space: pre-wrap;">${escapeHtml(replySnippet)}</div>
      </div>

      <p style="margin: 24px 0 8px;">
        <a href="${viewUrl}" style="display: inline-block; background: #4f7cff; color: #fff; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: 500;">View the full reply</a>
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
    res.status(500).json({ sent: false, reason: 'exception', message: String(err) });
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

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
