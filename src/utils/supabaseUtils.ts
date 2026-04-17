import { SUPABASE_URL, SUPABASE_ANON_KEY } from './environment';

/**
 * Get the Supabase URL from env. Throws if missing — fail loud, don't ship
 * a hardcoded production URL as a silent fallback.
 */
export function getSupabaseUrl(): string {
  if (!SUPABASE_URL) {
    throw new Error('VITE_SUPABASE_URL is not set');
  }
  return SUPABASE_URL;
}

/**
 * Get the Supabase anon (publishable) key from env. Throws if missing.
 */
export function getSupabaseAnonKey(): string {
  if (!SUPABASE_ANON_KEY) {
    throw new Error('VITE_SUPABASE_ANON_KEY is not set');
  }
  return SUPABASE_ANON_KEY;
}
