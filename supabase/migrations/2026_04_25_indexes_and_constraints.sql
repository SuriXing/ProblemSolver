-- ============================================================================
-- D1.1 part 1: Hot-path indexes + access_code format constraint.
--
-- Three indexes on the most-hit query paths, a partial UNIQUE on access_code
-- (live rows), a backfill of malformed codes, and a CHECK that pins the
-- access_code format we've been generating client-side since v1.
--
-- ⚠️  CONCURRENTLY note: `CREATE INDEX CONCURRENTLY` CANNOT run inside a
-- transaction. Supabase's SQL Editor runs each statement on its own
-- (autocommit) so this works as-is. If you migrate this via psql with `\set
-- AUTOCOMMIT off` or via a migration tool that wraps the file in BEGIN/COMMIT,
-- strip CONCURRENTLY first OR run each statement separately.
--
-- ⚠️  ORDER MATTERS: the backfill UPDATE runs BEFORE the UNIQUE index build.
-- If two legacy rows normalize to the same code (e.g. 'ab12CD34' + 'AB12CD34'
-- both → 'AB12CD34'), the UNIQUE index build would fail on duplicates. The
-- backfill must settle first so the UNIQUE creation either succeeds or fails
-- loud on a REAL pre-existing collision (which is a data-quality bug an admin
-- needs to triage — do NOT auto-resolve by suffixing or dropping rows).
--
-- All statements are idempotent (`IF NOT EXISTS` / `DROP CONSTRAINT IF EXISTS`).
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. Backfill malformed access_codes FIRST (before UNIQUE index build).
--
-- Older rows (pre-U-X4) may have lowercase letters or stray hyphens. Normalize
-- to upper-case + strip hyphens. After this runs, the UNIQUE index + CHECK
-- constraint below will reject duplicates or still-malformed rows — caller
-- sees a real DB error and an admin triages those specific rows.
-- ----------------------------------------------------------------------------
UPDATE posts
   SET access_code = upper(replace(access_code, '-', ''))
 WHERE access_code IS NOT NULL
   AND (access_code <> upper(access_code) OR access_code LIKE '%-%');


-- ----------------------------------------------------------------------------
-- 2. Partial UNIQUE index on posts(access_code) WHERE deleted_at IS NULL
--
-- Hits every call to `access_code_exists` (uniqueness check during code
-- generation) and `get_post_by_access_code` (user pastes their code).
-- Partial-on-not-deleted matches the WHERE clause those RPCs use; soft-deleted
-- rows are excluded so a code can be reused after a post is trashed.
--
-- UNIQUE — D1.2 round 1 security review caught that access_code had no
-- uniqueness constraint. The client-side generator does a uniqueness check
-- via `access_code_exists`, but that's TOCTOU: two concurrent generators
-- racing on the same code would both see "not exists" and both insert.
-- `get_post_by_access_code` does `LIMIT 1` so one of those posts becomes
-- silently unreachable. A partial UNIQUE INDEX closes the race at the DB
-- level — the second INSERT errors with unique_violation (23505), the
-- client retries with a fresh code.
--
-- Without this, both RPCs do a seq scan over `posts`. At ~10 posts that's
-- nothing; at ~10k it starts hurting; at ~100k the per-call latency dominates
-- our P95.
-- ----------------------------------------------------------------------------
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_access_code
  ON posts(access_code)
  WHERE deleted_at IS NULL;


-- ----------------------------------------------------------------------------
-- 3. Index on replies(post_id)
--
-- Hits every reply-list query (`getRepliesForPost`) and the count-of-replies
-- aggregation. Without it: seq scan of replies on every post page load.
-- ----------------------------------------------------------------------------
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_replies_post_id
  ON replies(post_id);


-- ----------------------------------------------------------------------------
-- 4. Composite index on posts(purpose, created_at DESC) WHERE deleted_at IS NULL
--
-- Hits `getPostsByPurpose` — the help-page list, sorted newest-first by
-- purpose ('need_help' | 'offer_help'). DESC matters: Postgres can read the
-- index forward and skip the sort step entirely.
-- ----------------------------------------------------------------------------
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_purpose_created
  ON posts(purpose, created_at DESC)
  WHERE deleted_at IS NULL;


-- ----------------------------------------------------------------------------
-- 5. Format CHECK constraint.
--
-- If any row still doesn't match `^[A-Z0-9]{8}$` after the backfill (e.g.
-- legacy 6-char codes from the v0 prototype), ALTER TABLE will fail loudly
-- — do NOT silently coerce or wipe; an admin needs to triage those rows.
--
-- Why CHECK and not a domain type: domains require more migration coordination
-- (function args, RPC signatures), CHECK is a one-line additive change.
--
-- ⚠️  ADD CONSTRAINT (without NOT VALID) takes an ACCESS EXCLUSIVE lock and
-- scans the whole table. On a 100k-row table that's a brief (<1s) stall.
-- If the table grows past ~1M rows before this migration ships, switch to:
--   ALTER TABLE ... ADD CONSTRAINT ... CHECK (...) NOT VALID;
--   ALTER TABLE ... VALIDATE CONSTRAINT ...;
-- which takes a weaker SHARE UPDATE EXCLUSIVE lock on the validation pass.
-- ----------------------------------------------------------------------------
ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_access_code_format_check;
ALTER TABLE posts
  ADD CONSTRAINT posts_access_code_format_check
  CHECK (access_code IS NULL OR access_code ~ '^[A-Z0-9]{8}$');


-- Verification:
-- SELECT indexname FROM pg_indexes WHERE tablename IN ('posts', 'replies')
--   AND indexname LIKE 'idx_%';
-- SELECT count(*) FROM posts WHERE access_code IS NOT NULL
--   AND access_code !~ '^[A-Z0-9]{8}$';  -- expect 0
-- SELECT access_code, count(*) FROM posts WHERE deleted_at IS NULL
--   GROUP BY access_code HAVING count(*) > 1;  -- expect 0 rows
