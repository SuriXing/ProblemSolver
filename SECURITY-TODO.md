# Security TODO

> **Priority: rotate within 24h** — leaked keys are still live in production bundles.

- [ ] **HUMAN ACTION REQUIRED — DO IMMEDIATELY AFTER APPLYING `2026_04_24_rate_limit.sql`:** Set the IP-hash salt, otherwise the bucket tokens are predictable from the migration source. Run in the Supabase SQL Editor (any single connection):
  ```sql
  -- Use openssl rand -hex 32 (or any 32+ char random string) on your laptop.
  ALTER DATABASE postgres SET app.rate_limit_ip_salt = 'PASTE_LONG_RANDOM_HEX_HERE';
  -- Then disconnect+reconnect (or restart project) so postgres picks it up.
  -- Verify:
  SELECT current_setting('app.rate_limit_ip_salt');  -- should NOT be 'UNSET-SALT-PLEASE-CONFIGURE'
  ```
- [ ] **HUMAN ACTION REQUIRED — DO BEFORE/WITH S2.1 MIGRATION:** Seed `admin_users` immediately after applying `2026_04_20_admin_users.sql`, or every admin gets locked out (Save/Delete silently fails, dashboard appears to work). **Strict order, single SQL Editor session:**
  1. List existing admin emails from Supabase dashboard → Authentication → Users.
  2. Apply the migration: paste `supabase/migrations/2026_04_20_admin_users.sql` and run.
  3. **Immediately after**, in the same session, seed the allowlist:
     ```sql
     -- Replace with your actual admin emails
     INSERT INTO admin_users (user_id, role)
     SELECT id, 'super_admin'
       FROM auth.users
      WHERE email IN ('admin@your-domain.com');
     ```
  4. Verify with: `SELECT * FROM admin_users;` (must show ≥1 row).
  5. From a logged-in admin client, confirm `SELECT public.is_admin();` returns `true`.
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
