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
const supabaseUrl = ENV.VITE_SUPABASE_URL || 'https://liyladrzzmiqpfqwyceg.supabase.co';
const supabaseAnonKey = ENV.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxpeWxhZHJ6em1pcXBmcXd5Y2VnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYzNDQ4MjgsImV4cCI6MjA2MTkyMDgyOH0.GatvzQKLFA-3rShIwgHMRYr6UE3nC-QBTuXD_ubYlpo';

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

// Function to check connection status
export async function checkSupabaseConnection() {
  try {
    const { data, error } = await supabase.from('posts').select('count');
    
    if (error && error.code === '42P01') {
      console.log('Posts table does not exist yet. This is expected if you need to run the setup scripts.');
      return true; // Connection is fine, table just doesn't exist
    } else if (error) {
      console.error('Error connecting to Supabase:', error);
      return false;
    }
    
    console.log('Connected to Supabase!');
    return true;
  } catch (error) {
    console.error('Exception when connecting to Supabase:', error);
    return false;
  }
} 