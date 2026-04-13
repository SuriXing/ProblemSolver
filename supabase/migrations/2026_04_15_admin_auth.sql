-- ============================================================================
-- U-X6: Admin auth via Supabase Auth
--
-- Run this in Supabase SQL Editor AFTER 2026_04_14_security_trio.sql.
-- This migration is idempotent — re-running is safe.
--
-- PREREQUISITES (must be done in the Supabase dashboard — not via SQL):
--   1. Authentication → Settings → Disable "Enable new user signups"
--      (otherwise anyone can self-register and become "authenticated",
--      which these policies grant admin access to)
--   2. Authentication → Users → Add user → create the admin account(s)
--      manually with email + password
--
-- See docs/admin-setup.md for the full setup walkthrough.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- Re-grant table-level UPDATE/DELETE for authenticated users only.
--
-- U-X5 REVOKEd these from anon and authenticated, which broke admin moderation.
-- Granting them back only to authenticated means the anon role (regular
-- visitors, no login) still cannot mutate or delete anything. Combined with
-- disabled public signups, the only way to get the authenticated role is to
-- have been manually provisioned as an admin in the Supabase dashboard.
-- ----------------------------------------------------------------------------

GRANT UPDATE, DELETE ON posts TO authenticated;
GRANT UPDATE, DELETE ON replies TO authenticated;


-- ----------------------------------------------------------------------------
-- RLS policies: any authenticated user can update/delete posts and replies.
--
-- The semantics are deliberately "any authenticated user = admin" — we don't
-- maintain a separate admin_users table because the access control layer is
-- "public signups are disabled." If that dashboard setting is flipped, the
-- security model breaks — this is documented in docs/admin-setup.md as the
-- single point of failure.
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Authenticated users can update posts" ON posts;
CREATE POLICY "Authenticated users can update posts"
  ON posts FOR UPDATE TO authenticated
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can delete posts" ON posts;
CREATE POLICY "Authenticated users can delete posts"
  ON posts FOR DELETE TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can update replies" ON replies;
CREATE POLICY "Authenticated users can update replies"
  ON replies FOR UPDATE TO authenticated
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can delete replies" ON replies;
CREATE POLICY "Authenticated users can delete replies"
  ON replies FOR DELETE TO authenticated
  USING (true);


-- ============================================================================
-- Verification queries:
--
-- 1) List the new admin policies:
-- SELECT tablename, policyname, roles, cmd FROM pg_policies
--  WHERE tablename IN ('posts', 'replies') AND 'authenticated' = ANY(roles);
--
-- 2) Confirm the anon role still has no UPDATE/DELETE privilege:
-- SELECT table_name, privilege_type FROM information_schema.table_privileges
--  WHERE grantee = 'anon' AND table_name IN ('posts', 'replies')
--    AND privilege_type IN ('UPDATE', 'DELETE');
--  (should return 0 rows)
-- ============================================================================
