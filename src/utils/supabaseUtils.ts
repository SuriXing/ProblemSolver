/**
 * Get the Supabase URL from environment variables
 */
export function getSupabaseUrl(): string {
  try {
    console.log('import.meta', import.meta);
    console.log('import.meta.env', import.meta.env);
    // For Vite
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      const url = import.meta.env.VITE_SUPABASE_URL;
      if (url) return url;
    } 
    // For Create React App
    else if (typeof process !== 'undefined' && process.env) {
      const url = process.env.REACT_APP_SUPABASE_URL;
      if (url) return url;
    }
  } catch (error) {
    console.error('Error getting Supabase URL:', error);
  }
  
  console.error('Supabase URL not found in environment variables');
  return '';
}

/**
 * Get the Supabase Anon Key from environment variables
 */
export function getSupabaseAnonKey(): string {
  try {
    // For Vite
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
      if (key) return key;
    } 
    // For Create React App
    else if (typeof process !== 'undefined' && process.env) {
      const key = process.env.REACT_APP_SUPABASE_ANON_KEY;
      if (key) return key;
    }
  } catch (error) {
    console.error('Error getting Supabase Anon Key:', error);
  }
  
  console.error('Supabase Anon Key not found in environment variables');
  return '';
}

/**
 * Get the Supabase Service Role Key from environment variables
 * This key has admin privileges and should only be used in secure contexts
 */
export function getSupabaseServiceRoleKey(): string {
  try {
    // For Vite
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      const key = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
      if (key) return key;
    } 
    // For Create React App
    else if (typeof process !== 'undefined' && process.env) {
      const key = process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY;
      if (key) return key;
    }
  } catch (error) {
    console.error('Error getting Supabase Service Role Key:', error);
  }
  
  console.error('Supabase Service Role Key not found in environment variables');
  return '';
} 