-- ============================================================================
-- S2.1 (revised in S2.2 round 2): admin_users allowlist + tightened RLS
--
-- Run this in Supabase SQL Editor. Self-sufficient — applies cleanly on a
-- fresh project (does NOT require 2026_04_15_admin_auth.sql to have run).
-- Idempotent — re-running is safe.
--
-- ⚠️  ⚠️  ⚠️  CRITICAL DEPLOYMENT WARNING — READ BEFORE APPLYING  ⚠️  ⚠️  ⚠️
--
-- This migration creates an EMPTY admin_users table and replaces the previous
-- "any authenticated user is admin" RLS policies with strict membership-gated
-- ones. Until you INSERT a row for each existing admin, NO ONE can moderate
-- posts/replies — the dashboard will appear to load but every Save/Delete
-- silently fails.
--
-- BEFORE running this migration in production, prepare and review the seed:
--
--   -- Replace the email(s) with your actual admin account emails.
--   INSERT INTO admin_users (user_id, role)
--   SELECT id, 'super_admin'
--     FROM auth.users
--    WHERE email IN ('admin@your-domain.com');
--
-- Then run THIS migration immediately followed by the seed in the same
-- session. If you forget the seed you will lock yourself out — recovery
-- requires service-role access to insert the row manually.
--
-- ⚠️  ⚠️  ⚠️  END WARNING  ⚠️  ⚠️  ⚠️
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 0. Self-sufficiency: re-GRANT UPDATE/DELETE on posts/replies to
--    `authenticated`. The earlier 2026_04_14_security_trio.sql REVOKEd these
--    from anon+authenticated; 2026_04_15_admin_auth.sql restored them but
--    only as part of its own setup. Restating here so this migration applies
--    cleanly even if 2026_04_15 was skipped or rolled back.
-- ----------------------------------------------------------------------------
GRANT UPDATE, DELETE ON posts TO authenticated;
GRANT UPDATE, DELETE ON replies TO authenticated;


-- ----------------------------------------------------------------------------
-- 1. admin_users table — allowlist keyed by auth.users.id
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admin_users (
  user_id    uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role       text NOT NULL DEFAULT 'admin'
             CHECK (role IN ('super_admin', 'admin', 'moderator')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Authenticated users may SELECT their OWN row only — that's how the client
-- proves admin status. They cannot enumerate other admins or self-promote
-- (no INSERT/UPDATE/DELETE policies — those require service_role via dashboard).
DROP POLICY IF EXISTS "admin_users self-read" ON admin_users;
CREATE POLICY "admin_users self-read"
  ON admin_users FOR SELECT TO authenticated
  USING (user_id = auth.uid());


-- ----------------------------------------------------------------------------
-- 2. is_admin() helper — SECURITY DEFINER so RLS doesn't recurse
--
-- Returns true iff the calling JWT's auth.uid() exists in admin_users.
-- Used in the RLS policies below so they can be expressed declaratively.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid());
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;


-- ----------------------------------------------------------------------------
-- 3. Drop ALL prior permissive UPDATE/DELETE policies on posts/replies before
--    creating the is_admin()-gated replacements. PostgreSQL ORs policies
--    together, so a leftover "USING (true)" policy would bypass the gate.
--
--    Names below cover both this project's history (2026_04_15_admin_auth.sql)
--    AND any older variants — drops are no-ops if absent.
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated users can update posts" ON posts;
DROP POLICY IF EXISTS "Authenticated users can delete posts" ON posts;
DROP POLICY IF EXISTS "Authenticated users can update replies" ON replies;
DROP POLICY IF EXISTS "Authenticated users can delete replies" ON replies;
-- Defensive: any older "Allow ..." or "Enable ..." style names from earlier work.
DROP POLICY IF EXISTS "Allow authenticated update posts" ON posts;
DROP POLICY IF EXISTS "Allow authenticated delete posts" ON posts;
DROP POLICY IF EXISTS "Allow authenticated update replies" ON replies;
DROP POLICY IF EXISTS "Allow authenticated delete replies" ON replies;
-- And the new names too, so re-running this migration is idempotent.
DROP POLICY IF EXISTS "Admins can update posts" ON posts;
DROP POLICY IF EXISTS "Admins can delete posts" ON posts;
DROP POLICY IF EXISTS "Admins can update replies" ON replies;
DROP POLICY IF EXISTS "Admins can delete replies" ON replies;

CREATE POLICY "Admins can update posts"
  ON posts FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete posts"
  ON posts FOR DELETE TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins can update replies"
  ON replies FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete replies"
  ON replies FOR DELETE TO authenticated
  USING (public.is_admin());


-- ----------------------------------------------------------------------------
-- 4. Tighten app_errors SELECT policy (S2.2 round 2 backend reviewer finding).
--    2026_04_18_app_errors_admin_read.sql granted "any authenticated user"
--    SELECT on the error log. Same anti-pattern this whole migration was
--    written to kill. Replace with is_admin() gating.
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated users can read app_errors" ON app_errors;
DROP POLICY IF EXISTS "Admins can read errors" ON app_errors;
DROP POLICY IF EXISTS "Admins can read app_errors" ON app_errors;
CREATE POLICY "Admins can read app_errors"
  ON app_errors FOR SELECT TO authenticated
  USING (public.is_admin());


-- ============================================================================
-- Verification queries (run these AFTER seeding admin_users):
--
-- 1) Confirm the new policies are the only UPDATE/DELETE policies on these
--    tables (any leftover "Authenticated users can ..." rows = bug):
-- SELECT tablename, policyname, qual FROM pg_policies
--  WHERE tablename IN ('posts','replies') AND cmd IN ('UPDATE','DELETE');
--
-- 2) Confirm a non-admin authenticated user is blocked:
-- SELECT public.is_admin();   -- false unless caller is in admin_users
--
-- 3) Smoke test as one of your seeded admins (from a logged-in client):
--   -- should return true, then the UPDATE should succeed
-- ============================================================================
