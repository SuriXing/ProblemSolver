// Re-export from the canonical client in src/lib/supabase.ts.
//
// Historical note: two separate createClient() calls used to live here and
// in src/lib/supabase.ts. Both were configured identically, so they worked
// by accident — but having two instances is a latent footgun: auth state
// (the signed-in session JWT) is per-client, so if one client signed in
// and the other one served a request, the request would be anon even
// though the user thought they were authenticated. The U28 confidence
// reviewer (finding I1) called it out. Consolidating to one instance.
export { supabase } from '../lib/supabase';
