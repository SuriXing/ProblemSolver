// Cross-platform environment variable access
export function getEnvironment() {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    // Vite browser environment
    return {
      SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL as string,
      SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY as string
    };
  } else if (typeof process !== 'undefined' && process.env) {
    // Node.js environment
    return {
      SUPABASE_URL: process.env.VITE_SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL || '',
      SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY || ''
    };
  }
  // Fallback for development
  return {
    SUPABASE_URL: '',
    SUPABASE_ANON_KEY: ''
  };
} 