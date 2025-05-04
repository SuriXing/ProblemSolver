import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database.types';
import { getSupabaseUrl, getSupabaseServiceRoleKey } from '../utils/supabaseUtils';

// Get Supabase credentials
const supabaseUrl = getSupabaseUrl();
const supabaseServiceRoleKey = getSupabaseServiceRoleKey();

// Create an admin client for server-side operations
// This should only be used in secure contexts (e.g., API routes)
export const supabaseAdmin = createClient<Database>(
  supabaseUrl,
  supabaseServiceRoleKey
); 