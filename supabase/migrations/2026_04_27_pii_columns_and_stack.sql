-- ============================================================================
-- D1.1 part 3: PII column lockdown + app_errors stack widening.
--
-- Two unrelated cleanups bundled because they're both column-grant tweaks:
--
--   1. Revoke SELECT on posts.notify_email and posts.notify_via_email from
--      anon. These columns store the post author's contact email — pure PII
--      that the public never needs to read. The current policy from
--      U-X5 / 2026_04_14_security_trio.sql explicitly GRANTed SELECT on
--      every column EXCEPT access_code, which means the email-notification
--      columns added in 2026_04_12 leaked back into the anon-readable set
--      because a fresh INSERT migration didn't update the trio's grant list.
--
--      The send-reply-notification API (api/send-reply-notification.ts) reads
--      these via the service-role key on the server, so revoking from anon is
--      safe — the email path keeps working.
--
--   2. Widen app_errors.error_stack from 8000 to 20000 chars. Modern stacks
--      from minified+sourcemapped React error boundaries routinely exceed
--      8000 chars; we've been silently dropping useful trace tails.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. Revoke email-notification PII from anon/authenticated SELECT.
--
-- The 2026_04_14_security_trio migration enumerated the SELECT grant list
-- explicitly (id, user_id, title, content, tags, purpose, is_anonymous,
-- status, views, created_at, updated_at) — notify_email/notify_via_email
-- weren't in that list at the time, but Postgres column-level GRANT semantics
-- mean anon currently has SELECT on ALL columns of any column added AFTER
-- the trio ran (because the trio only revoked access_code, not the rest).
--
-- Belt + suspenders: explicitly REVOKE on these two columns. Idempotent.
-- ----------------------------------------------------------------------------
REVOKE SELECT (notify_email)    ON posts FROM anon, authenticated;
REVOKE SELECT (notify_via_email) ON posts FROM anon, authenticated;

-- Service-role bypasses GRANTs so the API server can still read the email
-- when sending reply notifications. No code change needed.


-- ----------------------------------------------------------------------------
-- 2. app_errors.error_stack: 8000 → 20000.
--
-- Drop the old CHECK and re-add with the higher bound.
-- TEXT column has no inherent length; the only constraint is the CHECK.
-- ----------------------------------------------------------------------------
ALTER TABLE app_errors DROP CONSTRAINT IF EXISTS app_errors_stack_length_check;
ALTER TABLE app_errors
  ADD CONSTRAINT app_errors_stack_length_check
  CHECK (error_stack IS NULL OR char_length(error_stack) <= 20000);


-- Verification:
-- 1) Column grants on posts:
--    SELECT grantee, privilege_type, column_name FROM information_schema.column_privileges
--     WHERE table_name = 'posts' AND column_name IN ('notify_email','notify_via_email');
--    -- expect NO rows for grantee = 'anon' or 'authenticated'.
--
-- 2) New stack length:
--    INSERT INTO app_errors (source, error_message, error_stack)
--      VALUES ('test', 'check', repeat('x', 19999));  -- expect success
--    INSERT INTO app_errors (source, error_message, error_stack)
--      VALUES ('test', 'check', repeat('x', 20001));  -- expect CHECK violation
