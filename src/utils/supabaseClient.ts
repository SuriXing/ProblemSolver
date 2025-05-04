import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types';

// Hardcoded values as fallback - these should match your .env values
const FALLBACK_SUPABASE_URL = 'https://liyladrzzmiqpfqwyceg.supabase.co';
const FALLBACK_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxpeWxhZHJ6em1pcXBmcXd5Y2VnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYzNDQ4MjgsImV4cCI6MjA2MTkyMDgyOH0.GatvzQKLFA-3rShIwgHMRYr6UE3nC-QBTuXD_ubYlpo';

export function getSupabaseConfig() {
  // Try all possible ways to access environment variables
  let supabaseUrl = '';
  let supabaseAnonKey = '';
  
  // 1. Try import.meta.env (Vite)
  if (typeof import.meta !== 'undefined') {
    console.log('import.meta exists:', import.meta);
    
    if (import.meta.env) {
      console.log('import.meta.env exists:', import.meta.env);
      supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    } else {
      console.log('import.meta.env is undefined');
    }
  }
  
  // 2. Try global __VITE_ENV__ (from vite.config.ts)
  if (!supabaseUrl && typeof window !== 'undefined' && '__VITE_ENV__' in window) {
    console.log('__VITE_ENV__ exists');
    const viteEnv = (window as any).__VITE_ENV__;
    supabaseUrl = viteEnv.VITE_SUPABASE_URL;
    supabaseAnonKey = viteEnv.VITE_SUPABASE_ANON_KEY;
  }
  
  // 3. Try process.env (Node.js)
  if (!supabaseUrl && typeof process !== 'undefined' && process.env) {
    console.log('Using process.env');
    supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
    supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY;
  }
  
  // 4. Fallback to hardcoded values if nothing else worked
  if (!supabaseUrl) {
    console.log('Using fallback values');
    supabaseUrl = FALLBACK_SUPABASE_URL;
    supabaseAnonKey = FALLBACK_SUPABASE_ANON_KEY;
  }
  
  return { supabaseUrl, supabaseAnonKey };
}

// Create and export the Supabase client
const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey); 