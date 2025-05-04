import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database.types';

// Hardcoded credentials for development only - REMOVE IN PRODUCTION
const supabaseUrl = 'https://liyladrzzmiqpfqwyceg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxpeWxhZHJ6em1pcXBmcXd5Y2VnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYzNDQ4MjgsImV4cCI6MjA2MTkyMDgyOH0.GatvzQKLFA-3rShIwgHMRYr6UE3nC-QBTuXD_ubYlpo';

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