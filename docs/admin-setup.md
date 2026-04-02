# Admin Setup

The admin panel uses Supabase Auth. There is no hardcoded password; every
admin is a real user account you create in the Supabase dashboard.

## First-time setup (do this once before launch)

1. **Disable public signups — project-wide.** Open the Supabase dashboard
   for this project. Go to **Authentication → Settings** and turn OFF
   **"Allow new user signups."** This is the project-wide kill switch and
   blocks every auth provider (email, OAuth, magic link, SAML, phone). The
   per-provider "Enable email signup" toggle is NOT sufficient — if any
   OAuth provider is also enabled, a random visitor who clicks "Sign in
   with Google" still becomes authenticated and the admin RLS policies
   will treat them as an admin.

   Also audit **Authentication → Providers** and disable every provider
   that isn't being used for admin login. If you're using email+password
   for admin, leave only the Email provider enabled and flip every OAuth
   provider off.

   Finally, open **Authentication → Users** and confirm that the only
   row(s) there are the admins you expect. If any unfamiliar user exists,
   delete them before running the admin migrations.

2. **Create the admin user.** Still in Authentication, go to **Users → Add
   user → Create new user**. Use a real email address you control. Pick a
   long random password and store it in a password manager. This is the
   only account with moderation powers; losing the password means creating
   a new one via SQL.

3. **Apply the SQL migrations.** In order:
   - `supabase/migrations/2026_04_14_security_trio.sql` (U-X5)
   - `supabase/migrations/2026_04_15_admin_auth.sql` (U-X6)

   Open the Supabase SQL Editor, paste each file, and run. Both migrations
   are idempotent, so re-running is safe.

4. **Verify the lockout.** Open an incognito window, go to the site's
   `/admin/login` route, and try to sign up — there should be no signup
   affordance. Try to log in with a random email — it should fail. Log in
   with your admin account — it should succeed and take you to the
   dashboard.

## Why the model is "any authenticated user = admin"

Originally the plan was to whitelist a specific email in the RLS policy.
That's brittle (you have to edit the migration every time you add an admin)
and leaks the email into the repo. Instead we gate on
`auth.role() = 'authenticated'`, which is always true once public signups
are off — only admins you created manually have that role.

**Single point of failure:** if someone re-enables public signups in the
dashboard, the protection evaporates. Anyone who registers becomes an
admin. Treat the Authentication settings page as a security boundary; if
you manage a team, only one person should have access to it.

## Rotating the password

In the Supabase dashboard: **Authentication → Users → pick the admin →
Send magic link / Reset password**. Do NOT reset directly from the app
login page — the reset flow wants a valid session.

## Emergency lockout

If the admin account is compromised:

1. Open Supabase → Authentication → Users → delete the compromised user
2. Run the following SQL to invalidate any in-flight sessions:
   ```sql
   DELETE FROM auth.sessions WHERE user_id = '<old-user-id>';
   ```
3. Create a new admin user per step 2 above.
