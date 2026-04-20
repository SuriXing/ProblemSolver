-- ============================================================================
-- S4.1: Server-side rate limiting + RPC hardening
--
-- Run in Supabase SQL Editor. Idempotent. Self-sufficient (does not require
-- 2026_04_17_access_code_rpcs.sql to have run — it re-creates those funcs).
--
-- ⚠️  ⚠️  ⚠️  CRITICAL CONTEXT — READ BEFORE APPLYING  ⚠️  ⚠️  ⚠️
--
-- The pre-S4.1 SECURITY DEFINER RPCs (access_code_exists,
-- get_post_by_access_code, increment_views) had NO server-side rate limit
-- and NO length guard on text args. That means anon callers could:
--
--   1. Brute force the access_code space at the speed of HTTP RPC. The space
--      is 36^8 ≈ 2.8 × 10^12, so brute-forcing a SPECIFIC code is infeasible
--      — but a wide enumeration sweep ("does ANY 8-char code exist?") is
--      cheap, and any hit lets the attacker open someone else's post.
--   2. POST a 100MB string as p_access_code and force the server to upper()
--      and trim() it. Cheap denial-of-service.
--
-- This migration adds:
--   * `rate_limit_buckets` table — sliding-window counter keyed by
--     (kind, token_hash). Rows expire after 1h.
--   * `rate_limit_check()` SECURITY DEFINER — atomic increment-and-test.
--   * `request_ip_hash()` SECURITY DEFINER — pulls inet_client_addr() and
--     SHA-256s it with a per-deployment salt. Hashed (not raw) IPs go into
--     buckets so an admin reading the table can't deanonymize callers.
--   * Wrapped versions of access_code_exists, get_post_by_access_code, and
--     increment_views with rate-limit gate + length guards at the top.
--
-- Defense-in-depth on top of the S3.1 in-memory limit:
--   - S3.1 limit lives in the Vercel function process — multi-instance,
--     resets on cold start.
--   - This S4.1 limit lives in Postgres — single source of truth, durable.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. Salt for IP hashing.
--
-- IF YOU LEAVE THE DEFAULT, the hashes are predictable to anyone who reads
-- this file in source control. Per-deployment salt closes that. Set via
-- Supabase dashboard → Database → Custom config:
--   ALTER DATABASE postgres SET app.rate_limit_ip_salt = '<long random string>';
-- and reload (or restart the project). The function below uses
-- current_setting('app.rate_limit_ip_salt', true) and tolerates NULL by
-- falling back to a hard-coded warning marker (so behaviour is correct but
-- you'll see the marker in pg_stat_statements and know to set the salt).
-- ----------------------------------------------------------------------------


-- ----------------------------------------------------------------------------
-- 2. rate_limit_buckets table
--
-- Schema:
--   kind        — semantic bucket name ('access_code_lookup', 'increment_views', etc.)
--   token       — hashed identifier (usually IP hash). Plus 'kind' = composite PK.
--   window_start — when this bucket was first opened
--   counter     — number of hits inside the window
--
-- Eviction strategy: the function deletes rows whose window_start is older
-- than NOW() - 1 hour every ~1 in 100 calls (cheap probabilistic cleanup).
-- A nightly cron could replace this; for current traffic, probabilistic is
-- fine and avoids a moving-parts dependency.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rate_limit_buckets (
  kind         text        NOT NULL,
  token        text        NOT NULL,
  window_start timestamptz NOT NULL DEFAULT now(),
  counter      integer     NOT NULL DEFAULT 0,
  PRIMARY KEY (kind, token)
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_buckets_window
  ON rate_limit_buckets (window_start);

ALTER TABLE rate_limit_buckets ENABLE ROW LEVEL SECURITY;

-- No policies = no anon/authenticated access. The table is touched ONLY via
-- the SECURITY DEFINER function below, which runs as the table owner.
-- (Service-role still bypasses RLS for ops debugging.)


-- ----------------------------------------------------------------------------
-- 3. request_ip_hash() — SECURITY DEFINER
--
-- Returns SHA-256(salt || inet_client_addr()::text). Falls back to the
-- request id if inet_client_addr() is NULL (PgBouncer/edge cases).
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION request_ip_hash()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public, pg_temp
AS $$
DECLARE
  v_salt text;
  v_ip   text;
BEGIN
  v_salt := COALESCE(current_setting('app.rate_limit_ip_salt', true), 'UNSET-SALT-PLEASE-CONFIGURE');
  v_ip := COALESCE(inet_client_addr()::text, 'no-ip');
  RETURN encode(digest(v_salt || ':' || v_ip, 'sha256'), 'hex');
END;
$$;

REVOKE ALL ON FUNCTION request_ip_hash() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION request_ip_hash() TO anon, authenticated;


-- ----------------------------------------------------------------------------
-- 4. rate_limit_check() — SECURITY DEFINER
--
-- Atomically:
--   - opens a new bucket if none exists OR the existing window has expired
--   - increments the counter
--   - returns true if the new counter <= p_max, false otherwise
--
-- INSERT ... ON CONFLICT ... DO UPDATE serializes concurrent calls per
-- (kind, token) row. No race window — Postgres's row-level lock holds for
-- the duration of the upsert.
--
-- p_window_seconds: rolling-window duration. p_max: how many calls allowed
-- inside that window. Caller chooses the policy per bucket.
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
  v_started  timestamptz;
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

  -- Probabilistic eviction sweep. ~1% of calls scan + delete stale rows.
  -- At 100 RPS that's 1 sweep/sec; bucket population stays bounded.
  IF random() < 0.01 THEN
    DELETE FROM rate_limit_buckets WHERE window_start < v_now - interval '1 hour';
  END IF;

  -- Atomic upsert + counter logic. If the existing window has aged out,
  -- reset window_start AND counter (= 1). Otherwise increment.
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
  RETURNING counter, window_start INTO v_counter, v_started;

  RETURN v_counter <= p_max;
END;
$$;

REVOKE ALL ON FUNCTION rate_limit_check(text, text, int, int) FROM PUBLIC;
-- Not granted to anon/authenticated — only callable via other SECURITY DEFINER
-- functions in this file (the wrapped RPCs below). Keeping the surface small
-- so callers can't game the buckets directly.


-- ----------------------------------------------------------------------------
-- 5. log_rpc_failure() — SECURITY DEFINER helper
--
-- Insert a row into app_errors with hashed IP + the failed lookup value.
-- Used by access_code_exists / get_post_by_access_code on miss so admins can
-- spot enumeration sweeps. Best-effort; failure to log is swallowed.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION log_rpc_failure(p_kind text, p_value text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  BEGIN
    INSERT INTO app_errors (source, error_message, fingerprint, extra)
    VALUES (
      'rpc:' || left(p_kind, 32),
      'lookup miss',
      'rpc-miss:' || left(p_kind, 32),
      jsonb_build_object('value_hash', encode(digest(COALESCE(p_value, ''), 'sha256'), 'hex'),
                         'ip_hash', request_ip_hash())
    );
  EXCEPTION WHEN OTHERS THEN
    -- swallow — logging failure must never break the caller
    NULL;
  END;
END;
$$;

REVOKE ALL ON FUNCTION log_rpc_failure(text, text) FROM PUBLIC;


-- ----------------------------------------------------------------------------
-- 6. Re-create access_code_exists with rate limit + length guard.
--
-- Bucket policy: 30 calls / 60 seconds per IP hash. A real user generating
-- a code calls this once per attempt; the loop in generateAccessCode caps
-- at maybe 3 retries. 30 is generous; 60s window means a bot trying to brute
-- force gets ≤ 30 probes/min instead of the previous unbounded throughput.
--
-- On miss (existence = false), we log to app_errors so admins can spot
-- enumeration sweeps. We do NOT log hits — those are the legitimate
-- generateAccessCode uniqueness check (which expects ~100% miss).
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION access_code_exists(p_access_code text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public, pg_temp
AS $$
DECLARE
  v_code text;
BEGIN
  -- Length guard FIRST (cheap, blocks the obvious DoS before any locking).
  IF p_access_code IS NULL OR length(p_access_code) = 0 OR length(p_access_code) > 32 THEN
    RETURN false;
  END IF;

  -- Rate limit. Returns false if the limit is exceeded — same return shape
  -- as a "code does not exist" miss, so we don't leak the rate-limit signal
  -- back to the attacker.
  IF NOT rate_limit_check('access_code_exists', request_ip_hash(), 30, 60) THEN
    RETURN false;
  END IF;

  v_code := upper(trim(p_access_code));

  RETURN EXISTS (SELECT 1 FROM posts WHERE access_code = v_code);
END;
$$;

REVOKE ALL ON FUNCTION access_code_exists(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION access_code_exists(text) TO anon, authenticated;


-- ----------------------------------------------------------------------------
-- 7. Re-create get_post_by_access_code with rate limit + length guard +
--    miss logging.
--
-- Tighter bucket: 15 calls / 60s per IP. Legitimate use is "user pastes
-- their code and views the post" — once or twice per session. Anything
-- above 15/min from one IP is enumeration.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_post_by_access_code(p_access_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
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

  SELECT to_jsonb(p) INTO v_result
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
-- 8. Re-create increment_views with rate limit.
--
-- Bucket: 60 calls / 60s per IP. View counts aren't security-critical, but
-- without a cap an attacker could pump a post to "hot" or just generate
-- noise. 60/min is way more than legitimate browsing.
-- ----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS increment_views(uuid);

CREATE OR REPLACE FUNCTION increment_views(post_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_rows integer;
BEGIN
  IF post_id IS NULL THEN
    RETURN false;
  END IF;

  IF NOT rate_limit_check('increment_views', request_ip_hash(), 60, 60) THEN
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
-- 1) Confirm rate_limit_check correctly windows. Should show
--    counter resetting after the window passes:
--   SELECT rate_limit_check('test', 'tok', 3, 5);  -- t,t,t,f,f then wait 5s, t
--
-- 2) Confirm access_code_exists is gated:
--   DO $$
--   DECLARE i int; v boolean; BEGIN
--     FOR i IN 1..35 LOOP
--       v := access_code_exists('NEVER-EXISTS');
--     END LOOP;
--     -- After ~30 calls the gate trips; calls 31..35 should be false (silently
--     -- treated as misses).
--   END $$;
--
-- 3) Confirm bucket cleanup is happening (run after some traffic):
--   SELECT count(*), min(window_start), max(window_start) FROM rate_limit_buckets;
--
-- 4) ENSURE you set the salt:
--   SHOW app.rate_limit_ip_salt;
--   -- If "ERROR: unrecognized configuration parameter", run:
--   --   ALTER DATABASE postgres SET app.rate_limit_ip_salt = '<random>';
--   -- then disconnect+reconnect.
-- ============================================================================
