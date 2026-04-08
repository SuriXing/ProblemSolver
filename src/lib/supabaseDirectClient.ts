import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database.types';

// Hardcoded credentials for development only - REMOVE IN PRODUCTION
const supabaseUrl = 'https://bihltxhebindflclsutw.supabase.co';
const supabaseAnonKey = 'sb_publishable_ochy1eHzpFRMSCOndm3FQg_mLvGhDrL';

// Create a direct Supabase client
export const supabaseDirect = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Test the connection immediately
(async () => {
  try {
    const { error } = await supabaseDirect.from('posts').select('count', { count: 'exact', head: true });
    if (error) {
      console.error('Direct client connection test failed:', error);
    } else {
      console.log('Direct client connection test successful!');
    }
  } catch (error) {
    console.error('Error during direct client connection test:', error);
  }
})(); 