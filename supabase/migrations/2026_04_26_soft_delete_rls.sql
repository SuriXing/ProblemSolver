-- ============================================================================
-- D1.1 part 2: Soft-delete RLS at the table level.
--
-- Defense-in-depth: the existing `get_post_by_access_code` RPC already filters
-- `deleted_at IS NULL`, BUT direct table queries from the client (e.g.
-- `getPostsByPurpose`, list views, the help page) currently rely on the
-- service-layer adding `.is('deleted_at', null)` to every chain.
--
-- That works UNTIL someone forgets one. Adding the predicate to the RLS policy
-- itself makes "anon sees soft-deleted rows" structurally impossible —
-- regardless of what the service layer chains.
--
-- The admin path uses an authenticated session with a separate policy (the
-- admin dashboard explicitly opts in to seeing deleted via service-role
-- key + admin RLS), so this does NOT break the Deleted section.
-- ============================================================================

-- Replace the existing permissive "Anyone can read posts" policy.
-- That policy was created in 2026_04_12_replies_rls_policies.sql with
-- USING (true) — read everything. Tighten it to live rows only.
DROP POLICY IF EXISTS "Anyone can read posts" ON posts;
DROP POLICY IF EXISTS "Anon reads non-deleted posts only" ON posts;
DROP POLICY IF EXISTS "Authenticated reads all posts" ON posts;

CREATE POLICY "Anon reads non-deleted posts only"
  ON posts
  FOR SELECT
  TO anon
  USING (deleted_at IS NULL);

-- Authenticated (= logged-in admin) keeps full read so the dashboard can
-- show the Deleted section. Admin auth gating happens in the admin policy
-- and at the service-role layer; this is just removing the anon footgun.
--
-- ⚠️  FUTURE: if regular users ever get authenticated sessions (not just
-- admin), tighten this to `USING (is_admin() OR deleted_at IS NULL)`. Right
-- now the only authenticated callers are admin dashboard users, so
-- USING (true) is correct; but it's a time bomb if auth expands without
-- revisiting this policy. See D1.2 round 1 security review.
CREATE POLICY "Authenticated reads all posts"
  ON posts
  FOR SELECT
  TO authenticated
  USING (true);


-- ----------------------------------------------------------------------------
-- Replies soft-delete gap: when a post is soft-deleted, its replies remain
-- readable via a direct /rest/v1/replies query because the replies RLS was
-- `USING (true)`. Tighten anon reads to only replies whose parent post is live.
--
-- D1.2 round 1 security review found this orphan-readable gap.
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Anyone can read replies" ON replies;
DROP POLICY IF EXISTS "Anon reads replies of non-deleted posts" ON replies;
DROP POLICY IF EXISTS "Authenticated reads all replies" ON replies;

CREATE POLICY "Anon reads replies of non-deleted posts"
  ON replies
  FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM posts p
       WHERE p.id = replies.post_id
         AND p.deleted_at IS NULL
    )
  );

CREATE POLICY "Authenticated reads all replies"
  ON replies
  FOR SELECT
  TO authenticated
  USING (true);


-- Verification:
-- 1) As anon: a SELECT with no filters returns only deleted_at IS NULL.
--    SET ROLE anon;
--    SELECT count(*) FROM posts WHERE deleted_at IS NOT NULL;  -- expect 0
-- 2) As authenticated: full row count.
--    SET ROLE authenticated;
--    SELECT count(*) FROM posts;  -- expect total including deleted
-- 3) Existing get_post_by_access_code RPC unchanged behavior — it runs
--    SECURITY DEFINER so RLS is bypassed there; the WHERE deleted_at IS NULL
--    inside the function still does the work for the lookup path.
