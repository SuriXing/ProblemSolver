-- ============================================================================
-- U-X26: app_errors table for client-side error logging
--
-- Run this in Supabase SQL Editor:
--   https://supabase.com/dashboard/project/_/sql/new
--
-- This migration is idempotent — re-running is safe.
-- ============================================================================

CREATE TABLE IF NOT EXISTS app_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  source TEXT NOT NULL,
  route TEXT,
  user_agent TEXT,
  error_message TEXT NOT NULL,
  error_stack TEXT,
  extra JSONB,
  fingerprint TEXT
);

-- Index for the admin "recent errors" view and the fingerprint dedup count.
CREATE INDEX IF NOT EXISTS idx_app_errors_created ON app_errors(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_app_errors_fingerprint ON app_errors(fingerprint);

-- Length guards so a runaway error can't fill the table with megabytes of
-- serialized state. The client already slices these, but the DB is the last
-- line of defense.
ALTER TABLE app_errors DROP CONSTRAINT IF EXISTS app_errors_message_length_check;
ALTER TABLE app_errors DROP CONSTRAINT IF EXISTS app_errors_stack_length_check;
ALTER TABLE app_errors
  ADD CONSTRAINT app_errors_message_length_check
  CHECK (char_length(error_message) <= 1000);
ALTER TABLE app_errors
  ADD CONSTRAINT app_errors_stack_length_check
  CHECK (error_stack IS NULL OR char_length(error_stack) <= 8000);

-- RLS: anon can INSERT (so client errors can be logged without auth) but
-- CANNOT SELECT — errors may contain PII or access codes in stack traces.
-- Only the service role can read, which is how the admin dashboard pulls
-- them via the api/admin-errors endpoint.
ALTER TABLE app_errors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert errors" ON app_errors;
CREATE POLICY "Anyone can insert errors"
  ON app_errors FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- No SELECT policy intentionally → only service_role (bypasses RLS) can read.

GRANT INSERT ON app_errors TO anon, authenticated;
REVOKE SELECT ON app_errors FROM anon, authenticated;
