-- ============================================================================
-- Security audit hardening — 1/3: plug the PII leak in get_post_by_access_code
--
-- Findings from the pre-launch security audit (2026-04-28), HIGH:
--
-- The S4.1 rewrite of get_post_by_access_code shipped as
--   SELECT to_jsonb(p) FROM posts p WHERE p.access_code = v_code ...
--
-- to_jsonb(p) dumps the ENTIRE posts row as JSONB. That includes the author's
-- cleartext notify_email and notify_via_email columns. Any anonymous caller who
-- knows (or enumerates) an 8-char access code thus receives the author's email
-- address in the RPC response — circumvent. This violates the whole point of
-- 2026_04_27_pii_columns_and_stack.sql, which revoked SELECT on those columns
-- from anon: a SECURITY DEFINER function returning to_jsonb(p) bypasses
-- column-level grants entirely. The pre-S4.1 versions (2026_04_17 and
-- 2026_04_19) built an explicit jsonb_build_object that omitted PII; S4.1
-- silently regressed that. This migration restores the explicit whitelist.
--
-- We deliberately KEEP user_id in the output: the client needs it (HelpPage
-- admin search filters on it, HelpDetailPage uses it to render the "you own
-- this post" solve control). user_id is a stable public identifier, not PII
-- against a public worry-list. Only the email columns are removed.
--
-- Also hardens the mutate-by-code RPCs (mark_post_solved / mark_reply_solution)
-- so they can no longer touch soft-deleted posts, closing a hole where a
-- deleted post could be re-flagged or re-scored by whoever holds its code.
--
-- Idempotent — re-running is safe. Run in the Supabase SQL editor.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. Rewrite get_post_by_access_code with an explicit, PII-free column list.
--    Same rate limit, same length guard, same "missing vs wrong code is
--    indistinguishable" null shape — only the returned JSONB no longer leaks
--    the author's email. Trigger special, so no postgres settings needed.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_post_by_access_code(p_access_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_code   text;
  v_result jsonb;
BEGIN
  IF p_access_code IS NULL OR length(p_access_code) = 0 OR length(p_access_code) > 32 THEN
    RETURN NULL;
  END IF;

  IF NOT rate_limit_check('get_post_by_access_code', request_ip_hash(), 15, 60) THEN
    RETURN NULL;
  END IF;

  v_code := upper(trim(p_access_code));

  SELECT jsonb_build_object(
    'id',            p.id,
    'user_id',       p.user_id,
    'title',         p.title,
    'content',       p.content,
    'tags',          p.tags,
    'purpose',       p.purpose,
    'is_anonymous',  p.is_anonymous,
    'status',        p.status,
    'views',         p.views,
    'access_code',   p.access_code,
    'created_at',    p.created_at,
    'updated_at',    p.updated_at
  ) INTO v_result
    FROM posts p
   WHERE p.access_code = v_code
     AND p.deleted_at IS NULL
   LIMIT 1;

  IF v_result IS NULL THEN
    PERFORM log_rpc_failure('get_post_by_access_code', v_code);
  END IF;

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION get_post_by_access_code(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_post_by_access_code(text) TO anon, authenticated;


-- ----------------------------------------------------------------------------
-- 2. Harden mark_post_solved: never mutate a soft-deleted post.
-- ----------------------------------------------------------------------------
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
   WHERE access_code = v_code
     AND deleted_at IS NULL;

  GET DIAGNOSTICS v_rows = ROW_COUNT;
  RETURN v_rows > 0;
END;
$$;

REVOKE ALL ON FUNCTION mark_post_solved(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION mark_post_solved(text, text) TO anon, authenticated;


-- ----------------------------------------------------------------------------
-- 3. Harden mark_reply_solution: fail safe against soft-deleted posts and
--    never clear/mark solutions on them.
-- ----------------------------------------------------------------------------
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

  SELECT r.post_id INTO v_post_id
    FROM replies r
    JOIN posts p ON p.id = r.post_id
   WHERE r.id = p_reply_id
     AND p.access_code = v_code
     AND p.deleted_at IS NULL;

  IF v_post_id IS NULL THEN
    RETURN false;
  END IF;

  UPDATE replies
     SET is_solution = false,
         updated_at = now()
   WHERE post_id = v_post_id
     AND is_solution = true;

  UPDATE replies
     SET is_solution = true,
         updated_at = now()
   WHERE id = p_reply_id;

  UPDATE posts
     SET status = 'solved',
         updated_at = now()
   WHERE id = v_post_id;

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION mark_reply_solution(text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION mark_reply_solution(text, uuid) TO anon, authenticated;


-- ============================================================================
-- Verification (run in the SQL editor after applying):
--
-- 1) The lookup must NOT contain an email even when a row has notify_email set:
--    UPDATE posts SET notify_email = 'who@example.com' WHERE access_code = 'TEST123';
--    SELECT get_post_by_access_code('TEST123');  -- JSON has no notify_email / notify_via_email
--
-- 2) Soft-delete hard block:
--    UPDATE posts SET status = 'solved' WHERE access_code='TEST123';    -- expect 1
--    UPDATE posts SET deleted_at = now() WHERE access_code = 'TEST123';
--    SELECT mark_post_solved('TEST123', 'solved');                       -- expect false
-- ============================================================================