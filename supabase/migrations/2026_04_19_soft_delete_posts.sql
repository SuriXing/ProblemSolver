-- ============================================================================
-- U-X12: soft-delete for posts
--
-- Adds a `deleted_at` timestamp column to posts. The admin "delete" action
-- now sets this column instead of removing the row, so deletes are reversible
-- and an admin can see/restore them via a "Deleted" section in the dashboard.
--
-- Also updates the public-facing get_post_by_access_code RPC and the help-page
-- list query to filter out soft-deleted posts. End users never see them again.
--
-- Backfills existing legacy rows (status='deleted' or content like '[deleted%')
-- so they appear in the new Deleted section instead of the Unsolved one.
--
-- Run after 2026_04_18_app_errors_admin_read.sql. Idempotent.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- Schema: deleted_at column + partial index for the "Deleted" view
-- ----------------------------------------------------------------------------

ALTER TABLE posts ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_posts_deleted_at
  ON posts(deleted_at)
  WHERE deleted_at IS NOT NULL;

-- Re-grant SELECT on the new column to anon/authenticated since U-X5
-- explicitly enumerated the SELECT grant list.
GRANT SELECT (deleted_at) ON posts TO anon, authenticated;


-- ----------------------------------------------------------------------------
-- Backfill: existing junk rows that were "deleted" via old paths get a
-- non-null deleted_at so they show up in the new Deleted section.
-- ----------------------------------------------------------------------------

UPDATE posts
   SET deleted_at = COALESCE(updated_at, created_at, now())
 WHERE deleted_at IS NULL
   AND (status = 'deleted' OR content ILIKE '[deleted%');


-- ----------------------------------------------------------------------------
-- Update the public lookup RPC: never return soft-deleted rows to anon.
-- The admin path uses a different (authenticated) query that includes them.
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
    AND deleted_at IS NULL
  LIMIT 1;

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION get_post_by_access_code(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_post_by_access_code(text) TO anon, authenticated;


-- ----------------------------------------------------------------------------
-- access_code_exists also needs to ignore soft-deleted rows. Otherwise a
-- newly-generated code could collide with a deleted post's code and the
-- uniqueness check would reject it.
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
    SELECT 1 FROM posts
     WHERE access_code = v_code
       AND deleted_at IS NULL
  );
END;
$$;

GRANT EXECUTE ON FUNCTION access_code_exists(text) TO anon, authenticated;


-- ----------------------------------------------------------------------------
-- The help-page list (`getPostsByPurpose`) is a direct table query, not an
-- RPC, so we can't filter inside a function. The client-side query already
-- needs an explicit `.is('deleted_at', null)` chain — the service layer adds
-- this in the same commit as the migration.
-- ----------------------------------------------------------------------------

NOTIFY pgrst, 'reload schema';

-- Verification:
-- SELECT count(*) FILTER (WHERE deleted_at IS NULL) AS live,
--        count(*) FILTER (WHERE deleted_at IS NOT NULL) AS deleted
-- FROM posts;
