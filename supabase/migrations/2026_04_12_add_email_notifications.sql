-- Add email notification fields to posts table
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql/new

ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS notify_email TEXT,
  ADD COLUMN IF NOT EXISTS notify_via_email BOOLEAN DEFAULT false;

-- Index for faster lookups when a reply triggers notification
CREATE INDEX IF NOT EXISTS idx_posts_notify ON posts(notify_via_email) WHERE notify_via_email = true;

COMMENT ON COLUMN posts.notify_email IS 'Optional email address to notify when a reply is added';
COMMENT ON COLUMN posts.notify_via_email IS 'Whether the author opted into email notifications';
