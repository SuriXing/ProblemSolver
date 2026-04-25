-- ============================================================================
-- D1.1 part 1: Hot-path indexes + access_code format constraint.
--
-- Three indexes on the most-hit query paths and a CHECK constraint that pins
-- the access_code format we've been generating client-side since v1.
--
-- ⚠️  CONCURRENTLY note: `CREATE INDEX CONCURRENTLY` CANNOT run inside a
-- transaction. Supabase's SQL Editor runs each statement on its own
-- (autocommit) so this works as-is. If you migrate this via psql with `\set
-- AUTOCOMMIT off` or via a migration tool that wraps the file in BEGIN/COMMIT,
-- strip CONCURRENTLY first OR run each CREATE INDEX statement separately.
--
-- All four statements are idempotent (`IF NOT EXISTS` / `DROP CONSTRAINT IF
-- EXISTS`) so re-running is safe.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. Partial index on posts(access_code) WHERE deleted_at IS NULL
--
-- Hits every call to `access_code_exists` (uniqueness check during code
-- generation) and `get_post_by_access_code` (user pastes their code).
-- Partial-on-not-deleted matches the WHERE clause those RPCs use; soft-deleted
-- rows are dead weight here.
--
-- Without this, both RPCs do a seq scan over `posts`. At ~10 posts that's
-- nothing; at ~10k it starts hurting; at ~100k the per-call latency dominates
-- our P95.
-- ----------------------------------------------------------------------------
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_access_code
  ON posts(access_code)
  WHERE deleted_at IS NULL;


-- ----------------------------------------------------------------------------
-- 2. Index on replies(post_id)
--
-- Hits every reply-list query (`getRepliesForPost`) and the count-of-replies
-- aggregation. Without it: seq scan of replies on every post page load.
-- ----------------------------------------------------------------------------
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_replies_post_id
  ON replies(post_id);


-- ----------------------------------------------------------------------------
-- 3. Composite index on posts(purpose, created_at DESC) WHERE deleted_at IS NULL
--
-- Hits `getPostsByPurpose` — the help-page list, sorted newest-first by
-- purpose ('confession' / 'past-questions' / etc). DESC matters: Postgres
-- can read the index forward and skip the sort step entirely.
-- ----------------------------------------------------------------------------
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_purpose_created
  ON posts(purpose, created_at DESC)
  WHERE deleted_at IS NULL;


-- ----------------------------------------------------------------------------
-- 4. Backfill malformed access_codes, then enforce the format constraint.
--
-- Older rows (pre-U-X4) may have lowercase letters or stray hyphens. We
-- normalize to upper-case + strip hyphens. If a row still doesn't match the
-- 8-char A-Z0-9 pattern after normalization (e.g. legacy 6-char codes from
-- the v0 prototype), the CHECK constraint will reject it. In that case the
-- ALTER TABLE will fail loudly — do NOT silently coerce or wipe; an admin
-- needs to triage those rows.
--
-- Why CHECK and not a domain type: domains require more migration coordination
-- (function args, RPC signatures), CHECK is a one-line additive change.
-- ----------------------------------------------------------------------------

UPDATE posts
   SET access_code = upper(replace(access_code, '-', ''))
 WHERE access_code IS NOT NULL
   AND (access_code <> upper(access_code) OR access_code LIKE '%-%');

ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_access_code_format_check;
ALTER TABLE posts
  ADD CONSTRAINT posts_access_code_format_check
  CHECK (access_code IS NULL OR access_code ~ '^[A-Z0-9]{8}$');


-- Verification:
-- SELECT indexname FROM pg_indexes WHERE tablename IN ('posts', 'replies')
--   AND indexname LIKE 'idx_%';
-- SELECT count(*) FROM posts WHERE access_code IS NOT NULL
--   AND access_code !~ '^[A-Z0-9]{8}$';  -- expect 0
