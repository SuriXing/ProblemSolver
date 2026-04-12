-- Fix "0 replies" bug: make the replies table readable from the anon key.
--
-- Root cause: Row-Level Security (RLS) on the `replies` table is blocking
-- reads from the anonymous (public) key that the app uses. Inserts may work
-- (someone added a reply) but reads return empty, so PastQuestionsPage and
-- HelpDetailPage show "0 replies" even when replies exist.
--
-- Run this in Supabase SQL Editor:
--   https://supabase.com/dashboard/project/_/sql/new
-- and click "Run".
--
-- Before running, verify the current state with the diagnostic block at the
-- bottom of this file.

-- ============================================================================
-- PART 1: Enable RLS and add permissive policies
-- ============================================================================

-- Make sure RLS is ON for replies (required for policies to take effect)
ALTER TABLE replies ENABLE ROW LEVEL SECURITY;

-- Allow anyone (including anon) to READ replies.
-- This is appropriate for a public Q&A app where all posts and replies are
-- meant to be visible to anyone who knows the access code.
DROP POLICY IF EXISTS "Anyone can read replies" ON replies;
CREATE POLICY "Anyone can read replies"
  ON replies
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Allow anyone to INSERT replies.
-- Content moderation happens at the app layer (admin dashboard can delete).
DROP POLICY IF EXISTS "Anyone can insert replies" ON replies;
CREATE POLICY "Anyone can insert replies"
  ON replies
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow the post author (anyone with the access code, effectively) to UPDATE
-- replies — specifically the is_solution flag via markReplyAsSolution.
DROP POLICY IF EXISTS "Anyone can update replies" ON replies;
CREATE POLICY "Anyone can update replies"
  ON replies
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Also do the same for posts, just in case RLS is blocking there too.
-- If posts already has permissive policies this is a no-op thanks to DROP IF EXISTS.
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read posts" ON posts;
CREATE POLICY "Anyone can read posts"
  ON posts
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Anyone can insert posts" ON posts;
CREATE POLICY "Anyone can insert posts"
  ON posts
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can update posts" ON posts;
CREATE POLICY "Anyone can update posts"
  ON posts
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- PART 2: Diagnostic queries — run these separately to check the state
-- ============================================================================
-- (Uncomment and run one at a time in the SQL Editor)

-- 1) Is RLS enabled on replies? (should return rowsecurity=true after running PART 1)
-- SELECT schemaname, tablename, rowsecurity FROM pg_tables
-- WHERE tablename IN ('posts', 'replies');

-- 2) What policies exist on replies right now?
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
-- FROM pg_policies
-- WHERE tablename = 'replies';

-- 3) How many replies actually exist in the DB?
-- SELECT count(*) FROM replies;

-- 4) Are there replies for a specific access code?
-- (replace XXX with your actual access code)
-- SELECT r.id, r.content, r.created_at, p.access_code
-- FROM replies r
-- JOIN posts p ON p.id = r.post_id
-- WHERE p.access_code = 'XXX';
