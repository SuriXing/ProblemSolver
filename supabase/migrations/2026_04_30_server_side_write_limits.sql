-- ============================================================================
-- Security audit hardening — 3/3: cap anonymous writes & error-log abuse
--
-- Findings from the pre-launch security audit (2026-04-30), HIGH:
--
-- (a) The public anon role can INSERT posts and replies directly via PostgREST
--     (RLS `WITH CHECK (true)` + a table-level INSERT grant). The existing
--     rate limiter in 2026_04_24_rate_limit.sql only wraps the three lookup
--     RPCs (access_code_exists / get_post_by_access_code / increment_views);
--     the MUTATING paths were never throttled. So an anonymous botnet can POST
--     unlimited posts and replies — storage capacity DoS, spam flood,
--     content-moderation overwhelm. 1000+ writes in scripts/load-test.mjs were
--     driven straight at /rest/v1/posts with no throttle at any layer.
--
-- (b) app_errors is an unbounded anonymous-write table: RLS `WITH CHECK(true)`
--     INSERT plus GRANT INSERT TO anon. error_stack can be thousands of chars
--     and extra JSONB is unbounded, with no row cap and no retention. The
--     RPC miss-path also logs a row on every failed lookup (good for spotting
--     enumeration, but it grows the table too). Over time this is a storage
--     exhaustion sink; worse, error_stack/extra can carry access codes or PII
--     written by anonymous error boundaries.
--
-- Rather than forcing every write through an RPC (a big client refactor), we
-- put the throttle AT THE TABLE using BEFORE INSERT triggers keyed on the same
-- per-IP hash + rate_limit_check machinery, so the existing client INSERTs keep
-- working unchanged while the anon rate becomes bounded. And we add retention
-- pruning for app_errors so it cannot grow without limit.
--
-- This is entirely server-side and idempotent. Run in the Supabase SQL editor.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Trigger functions applying rate_limit_check on insert.
--    request_ip_hash() / rate_limit_check() are SECURITY DEFINER and REVOKEd
--    from PUBLIC, but a trigger runs as the DML invoker and these calls work
--    because the trigger function itself runs as the poster — it never elevates
--    and never exposes the hash. Per-IP buckets:
--      create_post:   10 / hour
--      create_reply:  30 / hour
--      app_errors:    500 / hour  (legit client error logging is bursty but low)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION enforce_create_post_rate_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT rate_limit_check('create_post', request_ip_hash(), 10, 3600) THEN
    RAISE EXCEPTION 'rate limit exceeded for create_post'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION enforce_create_reply_rate_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT rate_limit_check('create_reply', request_ip_hash(), 30, 3600) THEN
    RAISE EXCEPTION 'rate limit exceeded for create_reply'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION enforce_app_errors_rate_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT rate_limit_check('app_errors', request_ip_hash(), 500, 3600) THEN
    RAISE EXCEPTION 'rate limit exceeded for app_errors'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;


-- ----------------------------------------------------------------------------
-- 2. Attach the triggers. Re-running drops then re-creates.
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_limit_create_post ON posts;
CREATE TRIGGER trg_limit_create_post
  BEFORE INSERT ON posts
  FOR EACH ROW
  EXECUTE FUNCTION enforce_create_post_rate_limit();

DROP TRIGGER IF EXISTS trg_limit_create_reply ON replies;
CREATE TRIGGER trg_limit_create_reply
  BEFORE INSERT ON replies
  FOR EACH ROW
  EXECUTE FUNCTION enforce_create_reply_rate_limit();

DROP TRIGGER IF EXISTS trg_limit_app_errors ON app_errors;
CREATE TRIGGER trg_limit_app_errors
  BEFORE INSERT ON app_errors
  FOR EACH ROW
  EXECUTE FUNCTION enforce_app_errors_rate_limit();


-- ----------------------------------------------------------------------------
-- 3. Retention: keep the error log useful without letting it grow forever.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION prune_app_errors()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_deleted integer;
BEGIN
  DELETE FROM app_errors
   WHERE created_at < now() - interval '45 days';
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;

REVOKE ALL ON FUNCTION prune_app_errors() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION prune_app_errors() TO service_role;


-- ============================================================================
-- Verification queries (run after applying):
--
-- 1) Triggers exist:
--    SELECT tgname, tgrelid::regclass FROM pg_trigger
--     WHERE NOT tgisinternal AND tgname LIKE 'trg_limit_%';
--
-- 2) The throttle trips for a spammed create:
--    -- (same connection, or a temp IP) — after ~10 posts the next INSERT on
--    -- posts raises "rate limit exceeded for create_post".
--
-- 3) app_errors prune deleted rows:
--    INSERT INTO app_errors (source, error_message)
--      VALUES ('t','x') RETURNING id;
--    SELECT count(*) FROM app_errors WHERE created_at < now()-interval '46 days';
--    SELECT public.prune_app_errors();  -- > 0 when there are old rows
-- ============================================================================