# Security TODO

Owner-side follow-ups. Completed hygiene is summarized at the bottom; exact
mechanisms, key names and step-by-step commands are kept out of this file on
purpose — ask the owner if you need to repeat a procedure.

## Owner actions

- [ ] Refresh the public anon key when convenient: rotate it in the Supabase
      dashboard, update it in Vercel (Production and Preview) and in your local
      `.env.local`, then redeploy. The local development copy is stale and
      returns 401 on writes; the deployed key is meant to be public, so the
      protection is row-level security rather than secrecy.
- [ ] Keep every server-side secret in a non-`VITE_` variable. The current
      Vercel environment satisfies this — preserve the invariant when adding
      new ones.

## Completed

- Hardcoded fallback credentials removed from the source and from scripts;
  `.gitignore` blocks tool-generated env files; `.env.example` carries
  placeholders only.
- Reply-notification email path wired up with a shared secret that must stay in
  sync with the database config; callers without the secret are rejected, and
  a missing config degrades to "no emails", never to an open relay.
- Server-side rate limiting configured and verified with a bounded smoke test;
  caller IPs are hashed, never stored raw.
- Admin allowlist seeded and verified.
- Repository history reviewed for leaked literals; every tracked source file is
  clean.
- Production deployments built before the v1.0.0 snapshot removed.
