import { SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, getEnv } from './environment';

/**
 * Get the Supabase URL from environment variables or fallback
 */
export function getSupabaseUrl(): string {
  // Primary source: centralized environment variable
  const primaryUrl = SUPABASE_URL;
  
  // Always provide a fallback value for development
  const fallbackUrl = 'https://liyladrzzmiqpfqwyceg.supabase.co';

  return primaryUrl || fallbackUrl;
}

/**
 * Get the Supabase Anon Key from environment variables or fallback
 */
export function getSupabaseAnonKey(): string {
  // Primary source: centralized environment variable
  const primaryKey = SUPABASE_ANON_KEY;
  
  // Fallback for local development if needed
  const fallbackKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxpeWxhZHJ6em1pcXBmcXd5Y2VnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYzNDQ4MjgsImV4cCI6MjA2MTkyMDgyOH0.GatvzQKLFA-3rShIwgHMRYr6UE3nC-QBTuXD_ubYlpo';
  
  return primaryKey || fallbackKey;
}

/**
 * Get the Supabase Service Role Key from environment variables or fallback
 */
export function getSupabaseServiceRoleKey(): string {
  // Primary source: centralized environment variable
  const primaryKey = SUPABASE_SERVICE_ROLE_KEY;
  
  // If no environment variable is found, log error and return empty string
  if (!primaryKey) {
    console.error('Supabase Service Role Key not found in environment variables');
    return '';
  }
  
  return primaryKey;
} 