-- 2026_09_21 — Locale-aware reply emails.
--
-- The reply notification rendered hard-coded English copy while the site
-- ships five locales (en, zh-CN, ja, ko, es), and nothing ever recorded the
-- recipient's language. The opt-in now stores the browser locale the owner
-- opted in with, the trigger forwards it to the Vercel function, and the
-- function renders subject + body per locale with an en fallback. Backward
-- compatible: the column defaults to 'en', the RPC parameter is optional,
-- and the function ignores a missing locale field.

ALTER TABLE public.post_notifications
  ADD COLUMN IF NOT EXISTS locale text NOT NULL DEFAULT 'en';

CREATE OR REPLACE FUNCTION public.opt_in_email_notification(
  p_access_code text,
  p_email text,
  p_locale text DEFAULT 'en'
)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_code   text;
  v_mail   text;
  v_locale text;
BEGIN
  -- --- Input normalization + guards ---------------------------------------
  v_code := upper(trim(COALESCE(p_access_code, '')));
  IF v_code = '' OR length(v_code) > 64 THEN
    RETURN false;
  END IF;

  v_mail := trim(lower(COALESCE(p_email, '[]')));
  IF v_mail = '' OR length(v_mail) > 254
     OR v_mail !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN
    RETURN false;
  END IF;

  --   Locale is a display hint, not an identity: bound it to a language-tag
  --   shape (2-letter, optional 2-4 letter region) and fall back to en.
  v_locale := COALESCE(nullif(trim(COALESCE(p_locale, '')), ''), 'en');
  IF length(v_locale) > 10 OR v_locale !~ '^[a-zA-Z]{2}(-[a-zA-Z]{2,4})?$' THEN
    v_locale := 'en';
  END IF;

  -- --- Per-IP rate limit ---------------------------------------------------
  --   The June version ran call-less on purpose: the buckets and
  --   rate_limit_check() did not exist on the live AnonCafe-v2 database back
  --   then, so calling a missing function would have failed every opt-in.
  --   2026_07_18 backfilled both objects (verbatim from 2026_04_24), so the
  --   guard goes back in front of the upsert, same shape the three lookups
  --   have used since April: 10 opt-ins per hashed IP per 10 minutes.
  IF NOT rate_limit_check('email_optin'::text, request_ip_hash(), 10, 600) THEN
    RETURN false;
  END IF;

  -- --- Upsert the consent --------------------------------------------------
  --   ON CONFLICT lets a user who opts in, then submits another post,
  --   overwrite their access_code's email (harmless — access_code is unique
  --   per post). A re-submission also refreshes the locale, so a user who
  --   switched their browser language gets emails in the new one.
  INSERT INTO public.post_notifications (access_code, email, locale, updated_at)
  VALUES (v_code, v_mail, v_locale, now())
  ON CONFLICT (access_code)
  DO UPDATE SET
    email      = EXCLUDED.email,
    locale     = EXCLUDED.locale,
    updated_at = now();

  RETURN true;
END;
$function$;

CREATE OR REPLACE FUNCTION public.notify_post_owner_on_reply()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'net', 'pg_temp'
AS $function$
DECLARE
  v_code   text;
  v_email  text;
  v_locale text;
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

  SELECT pn.email, pn.locale INTO v_email, v_locale
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
                 'replyContent', left(NEW.content, 4500),
                 'locale',       v_locale
               ),
    headers := jsonb_build_object(
                 'Content-Type',     'application/json',
                 'X-Trigger-Secret', v_secret
               )
  );

  RETURN NULL;
END;
$function$;
