import { createClient } from '@supabase/supabase-js';
import { getSupabaseUrl, getSupabaseAnonKey } from '../utils/supabaseUtils';
import { IS_DEV } from '../utils/environment';

// Create a single supabase client for interacting with your database.
// getSupabaseUrl / getSupabaseAnonKey throw if the VITE_ env vars are missing
// — we want that to fail loudly rather than silently connect to a hardcoded
// project.
export const supabase = createClient(
  getSupabaseUrl(),
  getSupabaseAnonKey()
);

if (IS_DEV) {
  console.log('Using Supabase URL:', getSupabaseUrl());
}
