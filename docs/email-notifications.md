# Email Notifications Setup

When a user submits a confession/help request and opts into email
notifications, they should receive an email when someone replies.

This guide explains how the flow works and how to enable it.

## Architecture

```
ConfessionPage               DatabaseService            Vercel Function         Resend API
     │                            │                           │                     │
     │ submit (email,             │                           │                     │
     │  notify_via_email=true)    │                           │                     │
     ├───────────────────────────►│                           │                     │
     │                            │ INSERT into posts        │                     │
     │                            │ (notify_email,           │                     │
     │                            │  notify_via_email)       │                     │
     │                            ├─────────► Supabase       │                     │
     │                            │                          │                     │
     │                            │ ..................... time passes ...........  │
     │                            │                          │                     │
     │   someone else posts       │                          │                     │
     │   a reply via HelpDetail   │                          │                     │
     │                            │ createReply(...)         │                     │
     ├───────────────────────────►│                          │                     │
     │                            │ INSERT into replies      │                     │
     │                            │ SELECT notify_email      │                     │
     │                            │   FROM posts              │                     │
     │                            │ fetch /api/send-         │                     │
     │                            │   reply-notification     │                     │
     │                            ├─────────────────────────►│                     │
     │                            │                          │ POST /emails       │
     │                            │                          ├────────────────────►│
     │                            │                          │                     │ → author's inbox
     │                            │                          │◄────────────────────┤
     │                            │◄─────────────────────────┤                     │
```

## Step 1 — Run the DB migration

The `posts` table needs two new columns. Run the SQL in
`supabase/migrations/2026_04_12_add_email_notifications.sql` in the Supabase
SQL Editor (Dashboard → SQL Editor → New Query → paste → Run).

```sql
ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS notify_email TEXT,
  ADD COLUMN IF NOT EXISTS notify_via_email BOOLEAN DEFAULT false;
```

## Step 2 — Get a Resend API key

1. Sign up at https://resend.com (free, no credit card)
2. Go to https://resend.com/api-keys and create a key with "Sending access"
3. Copy the key (starts with `re_...`)

The free tier is 3,000 emails/month and 100/day — plenty for a prototype.

## Step 3 — Add the env var on Vercel

In the Vercel dashboard for this project:

```
Settings → Environment Variables →
  RESEND_API_KEY = re_...your key...
  (scope: Production + Preview + Development)
```

Or via the Vercel CLI:

```bash
vercel env add RESEND_API_KEY
```

## Step 4 — (Optional) Verify your own domain

By default, emails go out from `onboarding@resend.dev` — Resend's shared
sandbox. This works but may land in spam and shows "via resend.dev" in
the sender info.

For production, add your domain in Resend (https://resend.com/domains),
verify it via DNS records, and set the env var:

```
RESEND_FROM_ADDRESS=noreply@yourdomain.com
```

## Step 5 — Deploy

```bash
git push origin main   # triggers Vercel deployment
```

That's it — the `/api/send-reply-notification` route is auto-deployed
as a Node.js serverless function when Vercel detects files in `/api/`.

## Local testing

`npm run dev` runs **pure Vite** which does NOT serve files in `/api/`.
When a reply is posted in local dev:

- The reply IS created in the DB (Supabase call works)
- The fetch to `/api/send-reply-notification` returns a 404
- The error is caught and logged clearly:
  `[email] Notification endpoint returned 404. In dev mode this is expected — run 'vercel dev' to test the real handler.`

To test the handler for real locally, use the Vercel CLI:

```bash
npm install -g vercel
vercel link              # one-time, links to your Vercel project
vercel env pull          # pulls RESEND_API_KEY from Vercel to .env.local
vercel dev               # serves Vite AND /api/ routes on port 3000
```

`vercel dev` is a drop-in replacement for `npm run dev` that also runs
the serverless functions.

## What happens if RESEND_API_KEY is not set?

The API route detects this and returns `{ sent: false, reason: 'no_api_key' }`
with a console log showing what WOULD have been sent. This keeps the app
working end-to-end even before you've set up Resend — no errors, no
broken replies.

## Privacy note

The author's email is stored in `posts.notify_email` in plaintext. If you
care about stronger privacy:

1. Add a Supabase Row-Level Security policy on `posts` that hides the
   `notify_email` column from the anon key (readable only from the
   service role used by the serverless function)
2. Or hash the email and use a one-way token-based unsubscribe flow
