-- ============================================================================
-- U-X10: grant admin read access to app_errors
--
-- The U-X26 migration created app_errors with anon-can-INSERT / nobody-can-SELECT.
-- The U28 confidence reviewer (dimension 5, Observability) flagged that the
-- writing half works but the reading half doesn't — no admin dashboard can
-- display the errors, so an incident can't be detected within the 1-hour SLA.
--
-- Two options:
--   A) Build a Vercel function using the service role key. Needs deploy.
--   B) Add a SELECT policy scoped to the `authenticated` role (= admins,
--      since public signups are disabled per docs/admin-setup.md). Same
--      security boundary we already use for post/reply moderation in U-X6.
--
-- Picking B. Idempotent.
-- ============================================================================

GRANT SELECT ON app_errors TO authenticated;

DROP POLICY IF EXISTS "Admins can read errors" ON app_errors;
CREATE POLICY "Admins can read errors"
  ON app_errors
  FOR SELECT
  TO authenticated
  USING (true);

-- Verification:
-- SELECT policyname, cmd, roles FROM pg_policies WHERE tablename = 'app_errors';
-- expected: two rows — "Anyone can insert errors" (INSERT/anon,authenticated),
--                       "Admins can read errors"   (SELECT/authenticated)
