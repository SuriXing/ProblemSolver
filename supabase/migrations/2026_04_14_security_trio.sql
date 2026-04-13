-- ============================================================================
-- Security Trio migration (U-X5, U-X6, U-X7)
--
-- Run this in Supabase SQL Editor:
--   https://supabase.com/dashboard/project/_/sql/new
--
-- Fixes (all exploited in .harness/nodes/phase-0/run_1/eval-security-adversary.md):
--   * U-X5: anon key could SELECT access_code on every post, and UPDATE any post
--   * U-X7: posts/replies had no length limits (1 MB payloads accepted)
--
-- This migration is idempotent — re-running is safe.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- U-X5 PART 1: Hide access_code from the anon role
--
-- Postgres column-level privileges are evaluated independently of RLS.
-- Revoking SELECT on the column means any query that includes `access_code`
-- in the select list will fail with "permission denied for column access_code".
-- A WHERE predicate on access_code still works (the WHERE clause uses table-
-- level SELECT permission, which we keep).
-- ----------------------------------------------------------------------------

REVOKE SELECT (access_code) ON posts FROM anon;
REVOKE SELECT (access_code) ON posts FROM authenticated;

-- Explicitly re-grant SELECT on every other column so client-side selects keep
-- working. Add new columns here when the schema grows.
GRANT SELECT (
  id,
  user_id,
  title,
  content,
  tags,
  purpose,
  is_anonymous,
  status,
  views,
  created_at,
  updated_at
) ON posts TO anon, authenticated;


-- ----------------------------------------------------------------------------
-- U-X5 PART 2: Remove the permissive UPDATE policies
--
-- The replies_rls_policies migration created "Anyone can update replies" and
-- "Anyone can update posts" policies. Those are how the security adversary
-- defaced post 6c96da27 with one PATCH curl. Drop them.
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Anyone can update posts" ON posts;
DROP POLICY IF EXISTS "Anyone can update replies" ON replies;

-- Also revoke the table-level UPDATE privilege so a caller cannot bypass the
-- (now missing) RLS policy via the table grant. RPC functions run as
-- SECURITY DEFINER and ignore these grants.
REVOKE UPDATE ON posts FROM anon, authenticated;
REVOKE UPDATE ON replies FROM anon, authenticated;


-- ----------------------------------------------------------------------------
-- U-X5 PART 3: SECURITY DEFINER functions that validate the access code
--
-- These are the ONLY way anon callers can mutate posts/replies from now on.
-- Both functions require the caller to prove knowledge of the access code
-- for the post they're trying to mutate. If the code doesn't match, the
-- function returns false and changes nothing.
-- ----------------------------------------------------------------------------

-- Mark a post as solved / reopen it, given its access code.
CREATE OR REPLACE FUNCTION mark_post_solved(
  p_access_code text,
  p_status text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rows integer;
  v_code text;
BEGIN
  -- Input validation
  IF p_access_code IS NULL OR length(p_access_code) = 0 THEN
    RETURN false;
  END IF;
  IF p_status NOT IN ('open', 'solved') THEN
    RETURN false;
  END IF;

  v_code := upper(trim(p_access_code));

  UPDATE posts
     SET status = p_status,
         updated_at = now()
   WHERE access_code = v_code;

  GET DIAGNOSTICS v_rows = ROW_COUNT;
  RETURN v_rows > 0;
END;
$$;

REVOKE ALL ON FUNCTION mark_post_solved(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION mark_post_solved(text, text) TO anon, authenticated;


-- Mark a reply as the solution to a post, given the post's access code.
-- Unmarks any existing solution on the same post in the same transaction.
CREATE OR REPLACE FUNCTION mark_reply_solution(
  p_access_code text,
  p_reply_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_post_id uuid;
  v_code text;
BEGIN
  IF p_access_code IS NULL OR length(p_access_code) = 0 OR p_reply_id IS NULL THEN
    RETURN false;
  END IF;

  v_code := upper(trim(p_access_code));

  -- Resolve the post_id from the reply and verify the access code matches.
  SELECT r.post_id INTO v_post_id
    FROM replies r
    JOIN posts p ON p.id = r.post_id
   WHERE r.id = p_reply_id
     AND p.access_code = v_code;

  IF v_post_id IS NULL THEN
    -- Either the reply doesn't exist, or the access code is wrong.
    -- Same return value so the caller can't distinguish the two cases.
    RETURN false;
  END IF;

  -- Clear any existing solution on this post.
  UPDATE replies
     SET is_solution = false,
         updated_at = now()
   WHERE post_id = v_post_id
     AND is_solution = true;

  -- Mark this reply as the solution.
  UPDATE replies
     SET is_solution = true,
         updated_at = now()
   WHERE id = p_reply_id;

  -- Flip the post to solved too.
  UPDATE posts
     SET status = 'solved',
         updated_at = now()
   WHERE id = v_post_id;

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION mark_reply_solution(text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION mark_reply_solution(text, uuid) TO anon, authenticated;


-- ----------------------------------------------------------------------------
-- U-X7: Length limits at the DB level
--
-- Anything larger is rejected at INSERT/UPDATE time with a check_violation.
-- Client-side limits mirror these so the form can show a friendly error
-- before the request is made.
-- ----------------------------------------------------------------------------

-- Drop any pre-existing versions so re-running this migration is a no-op.
ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_content_length_check;
ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_title_length_check;
ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_access_code_length_check;
ALTER TABLE replies DROP CONSTRAINT IF EXISTS replies_content_length_check;

ALTER TABLE posts
  ADD CONSTRAINT posts_content_length_check
  CHECK (content IS NULL OR char_length(content) <= 4000);

ALTER TABLE posts
  ADD CONSTRAINT posts_title_length_check
  CHECK (title IS NULL OR char_length(title) <= 200);

ALTER TABLE posts
  ADD CONSTRAINT posts_access_code_length_check
  CHECK (access_code IS NULL OR char_length(access_code) <= 32);

ALTER TABLE replies
  ADD CONSTRAINT replies_content_length_check
  CHECK (content IS NULL OR char_length(content) <= 4000);


-- ============================================================================
-- Verification queries — run these manually to confirm the migration worked.
-- ============================================================================

-- 1) access_code is no longer in the anon SELECT list:
--    (should list every posts column EXCEPT access_code)
-- SELECT column_name
--   FROM information_schema.column_privileges
--  WHERE table_name = 'posts' AND grantee = 'anon' AND privilege_type = 'SELECT';

-- 2) No UPDATE policies remain on posts/replies:
-- SELECT tablename, policyname, cmd FROM pg_policies
--  WHERE tablename IN ('posts', 'replies') AND cmd = 'UPDATE';

-- 3) The RPC functions exist and are SECURITY DEFINER:
-- SELECT proname, prosecdef FROM pg_proc
--  WHERE proname IN ('mark_post_solved', 'mark_reply_solution');

-- 4) The length constraints exist:
-- SELECT conname FROM pg_constraint
--  WHERE conname LIKE '%length_check';
