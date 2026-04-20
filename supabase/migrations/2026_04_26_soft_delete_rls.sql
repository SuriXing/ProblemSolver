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

CREATE POLICY "Anon reads non-deleted posts only"
  ON posts
  FOR SELECT
  TO anon
  USING (deleted_at IS NULL);

-- Authenticated (= logged-in admin) keeps full read so the dashboard can
-- show the Deleted section. Admin auth gating happens in the admin policy
-- and at the service-role layer; this is just removing the anon footgun.
CREATE POLICY "Authenticated reads all posts"
  ON posts
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
