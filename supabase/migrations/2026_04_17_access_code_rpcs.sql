-- ============================================================================
-- U-X8: access_code read paths via SECURITY DEFINER functions
--
-- FIXES A REGRESSION IN U-X5 (2026_04_14_security_trio.sql):
--
-- That migration REVOKEd SELECT (access_code) from anon/authenticated, and
-- the inline comment claimed WHERE predicates would still work because they
-- use table-level SELECT. That claim is wrong: Postgres column-level SELECT
-- is ALSO required for any column referenced in a WHERE clause. As a result,
-- after U-X5 ships:
--
--   * generateAccessCode() fails its uniqueness check — `.select('access_code')`
--     gets "permission denied", the check silently returns "unique", and
--     new confessions are written with an undefined access_code. Users see
--     "UNKNOWN" as their code and lose access to their post forever.
--
--   * getPostByAccessCode() fails its lookup — `.eq('access_code', X)` gets
--     the same permission error, and every past-questions lookup returns null.
--
-- Flagged by the security reviewer (.harness/nodes/security-review-U-X5-X7/
-- run_1/eval-security.md, findings C1 and C2).
--
-- Fix: two SECURITY DEFINER functions that run with the owner's privileges
-- (bypassing the column REVOKE) and are called from the client via supabase.rpc.
-- Neither leaks access_code in a way that the caller doesn't already know —
-- access_code_exists takes a code and returns bool, get_post_by_access_code
-- takes a code and returns the post whose code matches (so the caller already
-- proved knowledge of the code).
--
-- Run in Supabase SQL Editor AFTER 2026_04_14_security_trio.sql.
-- Idempotent.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- access_code_exists — used by generateAccessCode for uniqueness check.
--
-- Oracle risk: an attacker can probe codes one at a time. With an 8-char
-- uppercase alphanumeric space (36^8 ≈ 2.8 × 10^12) and realistic rate limits,
-- brute forcing any specific code is infeasible. The function is marked STABLE
-- so PostgREST can batch it if needed.
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION access_code_exists(p_access_code text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  v_code text;
BEGIN
  IF p_access_code IS NULL OR length(p_access_code) = 0 THEN
    RETURN false;
  END IF;

  v_code := upper(trim(p_access_code));

  RETURN EXISTS (
    SELECT 1 FROM posts WHERE access_code = v_code
  );
END;
$$;

REVOKE ALL ON FUNCTION access_code_exists(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION access_code_exists(text) TO anon, authenticated;


-- ----------------------------------------------------------------------------
-- get_post_by_access_code — used by getPostByAccessCode for the lookup flow.
--
-- Returns the full post row (including access_code, since the caller just
-- proved knowledge of it) as JSONB. Returns NULL if no match. Same return
-- shape for "wrong code" and "no post" so the caller cannot distinguish.
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION get_post_by_access_code(p_access_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  v_code text;
  v_result jsonb;
BEGIN
  IF p_access_code IS NULL OR length(p_access_code) = 0 THEN
    RETURN NULL;
  END IF;

  v_code := upper(trim(p_access_code));

  SELECT jsonb_build_object(
    'id', id,
    'user_id', user_id,
    'title', title,
    'content', content,
    'tags', tags,
    'purpose', purpose,
    'is_anonymous', is_anonymous,
    'status', status,
    'views', views,
    'access_code', access_code,
    'created_at', created_at,
    'updated_at', updated_at
  ) INTO v_result
  FROM posts
  WHERE access_code = v_code
  LIMIT 1;

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION get_post_by_access_code(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_post_by_access_code(text) TO anon, authenticated;


-- ----------------------------------------------------------------------------
-- increment_views — bumps the view counter for a post.
--
-- Before U-X5 the client did a non-atomic select-then-update. U-X5 revoked
-- UPDATE on posts from anon/authenticated, which broke that path entirely.
-- The service layer already calls supabase.rpc('increment_views', ...) with
-- a fallback; U-X8 removed the fallback as dead code, and this migration
-- adds the missing function so the primary path works.
--
-- NOTE: a previous version of this function existed with a different return
-- type (likely void from an earlier dashboard-added function). CREATE OR
-- REPLACE can't change the return type, so we DROP first. This is safe:
-- the old function had no callers outside of this very rewrite.
-- ----------------------------------------------------------------------------

DROP FUNCTION IF EXISTS increment_views(uuid);

CREATE OR REPLACE FUNCTION increment_views(post_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rows integer;
BEGIN
  IF post_id IS NULL THEN
    RETURN false;
  END IF;

  UPDATE posts
     SET views = COALESCE(views, 0) + 1,
         updated_at = now()
   WHERE id = post_id;

  GET DIAGNOSTICS v_rows = ROW_COUNT;
  RETURN v_rows > 0;
END;
$$;

REVOKE ALL ON FUNCTION increment_views(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION increment_views(uuid) TO anon, authenticated;


-- ============================================================================
-- Verification queries:
--
-- 1) Functions exist and are SECURITY DEFINER:
-- SELECT proname, prosecdef FROM pg_proc
--  WHERE proname IN ('access_code_exists', 'get_post_by_access_code');
--
-- 2) Smoke test — round-trip a known-bad code:
-- SELECT access_code_exists('DOES-NOT-EXIST');  -- expect false
-- SELECT get_post_by_access_code('DOES-NOT-EXIST');  -- expect NULL
-- ============================================================================
