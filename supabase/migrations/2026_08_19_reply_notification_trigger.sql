-- ============================================================================
-- Reply notification trigger — the actual send side (reply → Resend)
--
-- What this wires:
--   1. pg_net (already enabled on AnonCafe-v2; CREATE EXTENSION IF NOT
--      EXISTS keeps it idempotent for fresh projects).
--   2. notify_post_owner_on_reply(): an AFTER INSERT trigger on replies.
--      For each new reply it finds the post's access_code, checks
--      post_notifications for an opt-in, and if the owner said yes it
--      stamps notified_at and fires net.http_post at the Vercel function
--      api/send-reply-notification with the trigger secret header.
--   3. The endpoint (api/send-reply-notification.ts, S3.3) accepts ONLY
--      requests carrying X-Trigger-Secret == NOTIFICATION_TRIGGER_SECRET.
--
-- Secret provisioning (different from the salt, for a reason):
--   The Management API query role can run DDL but NOT
--   ALTER DATABASE ... SET on custom parameters (42501) — the SQL Editor
--   role can, but that would make every rotation a dashboard visit. So the
--   secret lives in a single-row table, notification_config, revoke-closed
--   from anon/authenticated. Rotating is one UPDATE through the API:
--     UPDATE notification_config SET trigger_secret = '<32+ hex>';
--   The trigger FAILS SAFE: empty table or unset secret skips silently
--   instead of erroring every reply insert.
--
-- Honest trade-offs:
--   * notified_at is stamped when the request FIRES, not when Resend
--     confirms delivery — pg_net is fire-and-forget, so "sent" here really
--     means "handed to the email relay". The endpoint's response lands in
--     net._http_response for auditing.
--   * The shared secret lives in a database setting and a Vercel env, NOT
--     in this file. Repo access alone still can't call the endpoint.
--
-- Idempotent. Safe to re-run.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pg_net;


-- ----------------------------------------------------------------------------
-- 1. Secret holder — single-row, revoke-closed. Empty table = trigger skips
--    (fail safe). Rotation is an UPDATE, runnable through the Management API.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notification_config (
  id            int  PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  trigger_secret text NOT NULL
);

REVOKE ALL ON public.notification_config FROM PUBLIC;
REVOKE ALL ON public.notification_config FROM anon;
REVOKE ALL ON public.notification_config FROM authenticated;

ALTER TABLE public.notification_config ENABLE ROW LEVEL SECURITY;
-- No RLS policies: direct access is denied by lack of grants. The SECURITY
-- DEFINER trigger below bypasses by design; nothing else reads it.


-- ----------------------------------------------------------------------------
-- 2. Trigger function — SECURITY DEFINER because the inserting role is anon
--    and post_notifications is revoke-closed from anon by design.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.notify_post_owner_on_reply()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, net, pg_temp
AS $$
DECLARE
  v_code   text;
  v_email  text;
  v_post   text;
  v_secret text;
BEGIN
  SELECT c.trigger_secret INTO v_secret
    FROM public.notification_config c
   WHERE c.id = 1;
  IF v_secret IS NULL OR v_secret = '' THEN
    RETURN NULL;  -- secret not provisioned yet: skip, never error the reply
  END IF;

  SELECT p.access_code, p.content INTO v_code, v_post
    FROM public.posts p
   WHERE p.id = NEW.post_id;
  IF v_code IS NULL OR v_code = '' THEN
    RETURN NULL;  -- post row gone: nothing to notify about
  END IF;

  SELECT pn.email INTO v_email
    FROM public.post_notifications pn
   WHERE pn.access_code = v_code;
  IF v_email IS NULL THEN
    RETURN NULL;  -- owner never opted in: silent, by design
  END IF;

  UPDATE public.post_notifications
     SET notified_at = now()
   WHERE access_code = v_code;

  PERFORM net.http_post(
    url     := 'https://anoncafe.life/api/send-reply-notification',
    body    := jsonb_build_object(
                 'email',        v_email,
                 'accessCode',   v_code,
                 'postId',       NEW.post_id::text,
                 'postContent',  left(v_post, 1800),
                 'replyContent', left(NEW.content, 4500)
               ),
    headers := jsonb_build_object(
                 'Content-Type',     'application/json',
                 'X-Trigger-Secret', v_secret
               )
  );

  RETURN NULL;
END;
$$;


-- ----------------------------------------------------------------------------
-- 2. Wire the trigger. Drop-then-create so re-running stays idempotent.
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS replies_notify_owner ON public.replies;
CREATE TRIGGER replies_notify_owner
AFTER INSERT ON public.replies
FOR EACH ROW EXECUTE FUNCTION public.notify_post_owner_on_reply();
