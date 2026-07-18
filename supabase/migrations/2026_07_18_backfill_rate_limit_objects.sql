-- ============================================================================
-- Backfill: rate_limit_buckets + rate_limit_check on AnonCafe-v2
--
-- Why this file exists:
--   A schema audit (2026-07-18) compared the repo's migrations against the
--   LIVE database AnonCafe-v2 and found the server-side rate-limit core was
--   never fully applied there:
--        rate_limit_buckets table   -> MISSING
--        rate_limit_check function  -> MISSING
--   while request_ip_hash() and increment_views() DO exist. AnonCafe-v2 has no
--   supabase migration ledger (supabase_migrations.schema_migrations does not
--   exist), i.e. its schema is hand-deployed and only partially landed. That
--   means the three lookups get_post_by_access_code / access_code_exists /
--   increment_views were running with no real service-side throttle.
--
--   request_ip_hash() was verified to return a 64-char hex on the live db
--   before this was applied, so the salt is set and rate_limit_check will NOT
--   fail-closed. This file only adds the two missing pieces; it does NOT
--   re-create the RPCs or request_ip_hash.
--
-- Idempotent. Safe to re-run.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. rate_limit_buckets table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rate_limit_buckets (
  kind         text        NOT NULL,
  token        text        NOT NULL,
  window_start timestamptz NOT NULL DEFAULT now(),
  counter      integer     NOT NULL DEFAULT 0,
  PRIMARY KEY (kind, token)
);

ALTER TABLE rate_limit_buckets ENABLE ROW LEVEL SECURITY;
-- No policies = no anon/authenticated access; touched only via SECURITY DEFINER.
REVOKE ALL ON TABLE rate_limit_buckets FROM PUBLIC;
REVOKE ALL ON TABLE rate_limit_buckets FROM anon;
REVOKE ALL ON TABLE rate_limit_buckets FROM authenticated;


-- ----------------------------------------------------------------------------
-- 2. rate_limit_check() — SECURITY DEFINER (verbatim from 2026_04_24, the
--    piece AnonCafe-v2 was missing)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION rate_limit_check(
  p_kind            text,
  p_token           text,
  p_max             int,
  p_window_seconds  int
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_now      timestamptz := now();
  v_window   interval;
  v_counter  int;
BEGIN
  -- Length guards on all inputs (defense vs DoS).
  IF p_kind IS NULL OR length(p_kind) > 64 OR length(p_kind) = 0 THEN
    RETURN false;
  END IF;
  IF p_token IS NULL OR length(p_token) > 128 OR length(p_token) = 0 THEN
    RETURN false;
  END IF;
  IF p_max IS NULL OR p_max < 1 OR p_max > 1000 THEN
    RETURN false;
  END IF;
  IF p_window_seconds IS NULL OR p_window_seconds < 1 OR p_window_seconds > 86400 THEN
    RETURN false;
  END IF;

  v_window := make_interval(secs => p_window_seconds);

  -- Probabilistic eviction sweep (~1% of calls, shallow scan).
  IF random() < 0.01 THEN
    DELETE FROM rate_limit_buckets WHERE window_start < v_now - interval '1 hour';
  END IF;

  -- Atomic upsert + counter logic (window reset vs increment).
  INSERT INTO rate_limit_buckets (kind, token, window_start, counter)
  VALUES (p_kind, p_token, v_now, 1)
  ON CONFLICT (kind, token) DO UPDATE
    SET window_start = CASE
                          WHEN rate_limit_buckets.window_start < v_now - v_window
                          THEN v_now
                          ELSE rate_limit_buckets.window_start
                       END,
        counter      = CASE
                          WHEN rate_limit_buckets.window_start < v_now - v_window
                          THEN 1
                          ELSE rate_limit_buckets.counter + 1
                       END
  RETURNING counter INTO v_counter;

  RETURN v_counter <= p_max;
END;
$$;

REVOKE ALL ON FUNCTION rate_limit_check(text, text, int, int) FROM PUBLIC;
-- Not granted to anon/authenticated — only callable via other SECURITY DEFINER
-- functions (the wrapped RPCs). This is intentional.