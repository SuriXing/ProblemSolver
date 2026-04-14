import { createClient } from '@supabase/supabase-js';
import { getSupabaseUrl, getSupabaseAnonKey } from '../utils/supabaseUtils';
import { IS_DEV } from '../utils/environment';

// Debug the environment in a bundler-friendly way
console.log('Environment check:');
console.log('- typeof window:', typeof window);

// Fix the import.meta access methods
const ENV = import.meta.env || {};
console.log('- ENV available:', Object.keys(ENV).length > 0 ? 'yes' : 'no');

// Define fallback values for local development
const supabaseUrl = ENV.VITE_SUPABASE_URL || 'https://bihltxhebindflclsutw.supabase.co';
const supabaseAnonKey = ENV.VITE_SUPABASE_ANON_KEY || 'sb_publishable_ochy1eHzpFRMSCOndm3FQg_mLvGhDrL';

// Debug values
console.log('VITE_SUPABASE_URL value type:', typeof supabaseUrl);
console.log('VITE_SUPABASE_URL actual value:', supabaseUrl);

// 检查环境变量是否可用
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL or Anon Key is missing. Please check your environment variables.');
}

// Create a single supabase client for interacting with your database
export const supabase = createClient(
  getSupabaseUrl(),
  getSupabaseAnonKey()
);

// Log connection info only in development mode
if (IS_DEV) {
  console.log('Using Supabase URL:', getSupabaseUrl());
  const anonKey = getSupabaseAnonKey();
  if (anonKey) {
    console.log('Anon Key (first 10 chars):', anonKey.substring(0, 10) + '...');
  }
}
