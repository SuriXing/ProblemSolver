# Security TODO

- [ ] **HUMAN ACTION REQUIRED:** Rotate Supabase anon key. Exposed in git history before commit 554672d via hardcoded fallback in `src/lib/supabase.ts` (also in `scripts/load-test.mjs` until S1.1). Steps:
  1. Open Supabase dashboard → Project Settings → API.
  2. Click "Reset anon key" (or, if using new keyring, revoke `sb_publishable_ochy1eHzpFRMSCOndm3FQg_mLvGhDrL` and issue a new publishable key).
  3. Update `VITE_SUPABASE_ANON_KEY` in Vercel project env (Production, Preview, Development) and any local `.env.local`.
  4. Trigger a fresh prod deploy so the bundle ships the new key.
- [ ] **HUMAN ACTION REQUIRED:** Rotate Supabase service-role key if it was ever set on a `VITE_` env var in any Vercel environment (VITE_ vars are bundled into the client). Steps:
  1. Supabase dashboard → Project Settings → API → "Reset service_role key".
  2. Update `SUPABASE_SERVICE_ROLE_KEY` (no `VITE_` prefix) in Vercel env (Production + Preview only — never Development browser).
  3. Audit `vercel env ls` to confirm no `VITE_*SERVICE*` or `VITE_*SECRET*` keys exist.
- [x] Audit git history for other leaked literals. Done in S1.1 — see `.harness/git-leak-audit.txt`. Patterns checked: `sb_publishable_`, `bihltxhebindflclsutw`, `sk-`. All current tracked source files are clean.
- [ ] **HUMAN ACTION REQUIRED:** After rotation, purge any pre-554672d prod deployment whose bundle still contains the old key. Steps:
  1. `vercel ls` → find any deployments older than commit 554672d still aliased to a prod or preview domain.
  2. For each: `vercel rm <deployment-url> --yes`.
  3. Confirm the prod alias points to a post-rotation deployment via `vercel inspect <prod-domain>`.

## Completed by S1.1

- Git history leak audit captured to `.harness/git-leak-audit.txt`.
- Removed last hardcoded secret fallback from `scripts/load-test.mjs` (now requires env vars; exits 1 if missing).
- Hardened `.gitignore` with `*.local` and `.env.*.local` to block tool-generated secret files (e.g. Vercel CLI's `.env.production.local`).
- Sanitized `.env.example` to canonical `REPLACE_ME` placeholder format; added `APP_BASE_URL`.
- Added local-setup security callout to README.md.
