-- ============================================================================
-- Email notification opt-in — table + RPC (opt-in storage only, no send yet)
--
-- Background:
--   The old `notify_email` / `notify_via_email` columns lived on `posts` and
--   were revoked from anon (2026_04_27) then effectively removed, because
--   cleartext email next to confessional content on the anon-readable posts
--   table was a PII leak. The U-X5 note always said the real home for this
--   data is a separate `post_notifications` table + a server-side trigger.
--
--   This migration adds JUST the storage + anon opt-in, NOT the send side.
--   Sending (reply → trigger → Resend) is a later change and is intentionally
--   out of scope here. Until that ships, an opt-in row means "this person
--   consented to be emailed"; nothing more.
--
-- Design (keeps the S4.x lessons):
--   * anon CANNOT write to the table directly (no GRANT INSERT) — a direct
--     table insert would be an unbounded spam/PII-DoS sink.
--   * The ONLY anon caller is the opt_in_email_notification() RPC. It runs
--     SECURITY DEFINER, validates the email, rate-limits per hashed IP through
--     the existing rate_limit_check(), and refuses empty/invalid codes.
--   * The table is revoke-closed to anon/authenticated: SELECT is reserved
--     for future server-side code (service role) that actually sends emails.
--
-- Idempotent. Run in the Supabase SQL Editor (or via supabase db reset).
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.post_notifications (
  access_code text PRIMARY KEY,
  email       text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  -- Fired   := the send side has sent (or decided not to) for the latest reply.
  --           Kept false until the trigger lands. Not exposed to anon.
  notified_at timestamptz
);

COMMENT ON TABLE public.post_notifications IS
  'Email opt-in consent for post owners. PII. WITHOUT row-level SELECT for anon.';

-- Email format sanity (lightweight). Full validation happens in the RPC/UI.
ALTER TABLE public.post_notifications
  ADD CONSTRAINT post_notifications_email_format_check
  CHECK (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$');

-- access_code can't exceed the same bound the app uses (generateAccessCode is 8
-- chars, but we bound hard here against abuse).
ALTER TABLE public.post_notifications
  ADD CONSTRAINT post_notifications_access_code_len_check
  CHECK (length(access_code) BETWEEN 1 AND 64);


-- ----------------------------------------------------------------------------
-- 2. Restrict direct table access.
--    anon/authenticated get NOTHING on the table. The only writer is the
--    SECURITY DEFINER RPC below; the only reader is future server-side code.
-- ----------------------------------------------------------------------------
REVOKE ALL ON public.post_notifications FROM PUBLIC;
REVOKE ALL ON public.post_notifications FROM anon;
REVOKE ALL ON public.post_notifications FROM authenticated;

-- RLS is irrelevant once there are no direct grants, but keep it ON as
-- belt-and-suspenders for any future grant.
ALTER TABLE public.post_notifications ENABLE ROW LEVEL SECURITY;

-- No RLS policies are created — none is needed/wanted for anon. Direct SELECT
-- is simply denied by lack of grant. (RLS would apply if we later grant SELECT
-- to authenticated; that's a future decision, not this change.)


-- ----------------------------------------------------------------------------
-- 3. RPC: opt_in_email_notification(access_code, email)
--    SECURITY DEFINER — validates + rate-limits + upserts the consent.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.opt_in_email_notification(
  p_access_code text,
  p_email       text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_code text;
  v_mail text;
BEGIN
  -- --- Input normalization + guards ---------------------------------------
  v_code := upper(trim(COALESCE(p_access_code, '')));
  IF v_code = '' OR length(v_code) > 64 THEN
    RETURN false;
  END IF;

  v_mail := trim(lower(COALESCE(p_email, '')));
  IF v_mail = '' OR length(v_mail) > 254
     OR v_mail !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN
    RETURN false;
  END IF;

  -- --- Rate limit: per-IP sliding window (reuses the S4.1 machinery). ------------
  --   max 10 opt-ins per IP / 10 min. Generous for a real user, bounds a bot.
  IF NOT rate_limit_check('email_optin', request_ip_hash(), 10, 600) THEN
    RETURN false;
  END IF;

  -- --- Upsert the consent ---------------------------------------------------------
  --   ON CONFLICT lets a user who opts in, then submits another post, overwrite
  --   their access_code's email (harmless — access_code is unique per post).
  --   If the same access_code is re-submitted, it just refreshes the address.
  INSERT INTO public.post_notifications (access_code, email, updated_at)
  VALUES (v_code, v_mail, now())
  ON CONFLICT (access_code)
  DO UPDATE SET
    email      = EXCLUDED.email,
    updated_at = now();

  RETURN true;
END;
$$;