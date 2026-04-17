# Security TODO

- [ ] Rotate Supabase anon key. Exposed in git history before commit 554672d via hardcoded fallback in src/lib/supabase.ts.
- [ ] Rotate Supabase service-role key if it was ever set on a `VITE_` env var in any Vercel environment (VITE_ vars are bundled into the client).
- [ ] Audit git history for other leaked literals: `git log --all -S 'sb_publishable_' -p` and `git log --all -S 'bihltxhebindflclsutw' -p`.
- [ ] After rotation, purge any pre-554672d prod deployment whose bundle still contains the old key.
