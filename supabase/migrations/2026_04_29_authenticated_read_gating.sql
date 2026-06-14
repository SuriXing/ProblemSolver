-- ============================================================================
-- Security audit hardening — 2/3: stop "authenticated" from reading everything
--
-- Findings from the pre-launch security audit (2026-04-29), MEDIUM:
--
-- 2026_04_26_soft_delete_rls.sql granted the `authenticated` role
--   USING (true)  SELECT on EVERY post and EVERY reply,
-- including ALL soft-deleted rows and, because notify_email was revoked only
-- from anon, every author email. Its own comment calls this a time bomb:
-- it is only "correct" because today the only authenticated sessions are
-- admin-dashboard users. The instant public signups are toggled back on (or
-- any non-admin user gets an authenticated session), every one of those users
-- could read the whole table, deleted rows, and the author PII.
--
-- We now have an allowlist (`admin_users` + `public.is_admin()`). This migration
-- replaces the blanket authenticated reads with a gated read:
--   * users in admin_users (super_admin/admin/moderator) keep full visibility
--     including soft-deleted rows — the moderation dashboard needs that.
--   * ANY non-admin authenticated session sees exactly what the public anon
--     role sees: only live (not-deleted) posts, and replies whose parent post
--     is live.
--
-- It also drops (defensively, no-op if absent) the permissive UPDATE/DELETE
-- policies created by 2026_04_15_admin_auth.sql so that migration can never
-- re-insert "any authenticated user is admin" if a setup re-runs it after this
-- point. PostgreSQL ORs RLS policies together, so a single leftover USING(true)
-- UPDATE policy would bypass the allowlist gate entirely.
--
-- Idempotent — re-running is safe. Run in the Supabase SQL editor.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. Gate authenticated reads on posts: admins see everything, others see live.
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated reads all posts" ON posts;
DROP POLICY IF EXISTS "Admins read posts incl deleted" ON posts;
CREATE POLICY "Admins and live posts readable"
  ON posts
  FOR SELECT
  TO authenticated
  USING (public.is_admin() OR deleted_at IS NULL);


-- ----------------------------------------------------------------------------
-- 2. Gate authenticated reads on replies: admins see everything, others see
--    only replies whose parent post is live.
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated reads all replies" ON replies;
DROP POLICY IF EXISTS "Admins read replies incl deleted" ON replies;
CREATE POLICY "Admins and live replies readable"
  ON replies
  FOR SELECT
  TO authenticated
  USING (
    public.is_admin() OR EXISTS (
      SELECT 1 FROM posts p
       WHERE p.id = replies.post_id
         AND p.deleted_at IS NULL
    )
  );


-- ----------------------------------------------------------------------------
-- 3. Defensive teardown of 2026_04_15_admin_auth.sql's permissive UPDATE/DELETE
--    policies, so re-applying that migration (checked-in, described as
--    idempotent) can never resurrect "any authenticated user can moderate".
--    PostgreSQL ORs RLS policies together — a single leftover USING(true)
--    UPDATE/DELETE policy would bypass the is_admin() gate entirely.
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated users can update posts" ON posts;
DROP POLICY IF EXISTS "Authenticated users can delete posts" ON posts;
DROP POLICY IF EXISTS "Authenticated users can update replies" ON replies;
DROP POLICY IF EXISTS "Authenticated users can delete replies" ON replies;
DROP POLICY IF EXISTS "Allow authenticated update posts" ON posts;
DROP POLICY IF EXISTS "Allow authenticated delete posts" ON posts;
DROP POLICY IF EXISTS "Allow authenticated update replies" ON replies;
DROP POLICY IF EXISTS "Allow authenticated delete replies" ON replies;


-- ============================================================================
-- Verification queries (run after applying):
--
-- 1) The old blind policy is gone, the gated one exists:
--    SELECT tablename, policyname, cmd, qual FROM pg_policies
--     WHERE tablename IN ('posts','replies') AND 'authenticated' = ANY(roles)
--       AND cmd = 'SELECT';
--
-- 2) No "Authenticated users ..." UPDATE/DELETE policy remains (defensive):
--    SELECT policyname FROM pg_policies
--     WHERE tablename IN ('posts','replies') AND policyname LIKE 'Authenticated users%';
--    (expect 0 rows)
--
-- 3) As a NON-admin authenticated session, a soft-deleted post must be hidden:
--    -- (sign in as a non-admin; should return no deleted rows)
-- ============================================================================