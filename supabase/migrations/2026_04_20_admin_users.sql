-- ============================================================================
-- S2.1: admin_users allowlist + tighten admin RLS policies
--
-- Run this in Supabase SQL Editor AFTER 2026_04_15_admin_auth.sql.
-- Idempotent — re-running is safe.
--
-- WHY:
--   The 2026_04_15 migration treated "any authenticated user" as admin. That
--   model relied on a single dashboard switch (Authentication → Settings →
--   "Enable new user signups" = OFF). If anyone flips that switch, every
--   self-registered user becomes a moderator. This migration introduces an
--   explicit admin_users allowlist so that membership in that table — not
--   merely having a session — is what grants moderation rights.
--
-- HUMAN ACTION REQUIRED AFTER APPLYING:
--   For each existing admin auth.users row, insert a matching admin_users row:
--     INSERT INTO admin_users (user_id, role)
--     SELECT id, 'super_admin' FROM auth.users WHERE email = 'admin@your-domain';
--   Otherwise the dashboard will lock out every existing admin.
-- ============================================================================


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
-- 3. Replace permissive "any authenticated" policies with is_admin() gating
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated users can update posts" ON posts;
CREATE POLICY "Admins can update posts"
  ON posts FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Authenticated users can delete posts" ON posts;
CREATE POLICY "Admins can delete posts"
  ON posts FOR DELETE TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "Authenticated users can update replies" ON replies;
CREATE POLICY "Admins can update replies"
  ON replies FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Authenticated users can delete replies" ON replies;
CREATE POLICY "Admins can delete replies"
  ON replies FOR DELETE TO authenticated
  USING (public.is_admin());


-- ============================================================================
-- Verification queries:
--
-- 1) See the new policies (should all use is_admin()):
-- SELECT tablename, policyname, qual FROM pg_policies
--  WHERE tablename IN ('posts','replies') AND policyname LIKE 'Admins can%';
--
-- 2) Confirm a non-admin authenticated user is blocked:
-- SELECT public.is_admin();   -- should return false unless you're in admin_users
-- ============================================================================
