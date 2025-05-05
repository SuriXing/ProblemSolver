import { createClient } from '@supabase/supabase-js';
import { getSupabaseUrl, getSupabaseAnonKey } from './supabaseUtils';

// Access environment properties safely
const ENV = import.meta.env || {};

// Get Supabase credentials - either from environment or fallbacks
const supabaseUrl = getSupabaseUrl();
const supabaseAnonKey = getSupabaseAnonKey();

// Create the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Log environment info without directly accessing import.meta
console.log('Supabase client initialized with:');
console.log('- URL:', supabaseUrl);
console.log('- Environment variables available:', Object.keys(ENV).length > 0 ? 'yes' : 'no'); 