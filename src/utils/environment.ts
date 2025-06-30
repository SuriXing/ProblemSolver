/**
 * Centralized environment variable access
 */

// Define a safe way to access environment variables
function safeGetEnv(key: string, fallback: string = ''): string {
  try {
    // Try to access import.meta.env directly
    // @ts-ignore - Ignore TypeScript errors for direct access
    const viteValue = import.meta.env[key];
    if (viteValue !== undefined && typeof viteValue === 'string') {
      return viteValue;
    }
  } catch (e) {
    // Silent catch - import.meta.env isn't available
  }

  try {
    // Try to access process.env as fallback
    if (typeof process !== 'undefined' && process.env && typeof process.env[key] === 'string') {
      return process.env[key] as string;
    }
  } catch (e) {
    // Silent catch - process.env isn't available
  }

  return fallback;
}

// Supabase configuration with fallbacks
export const SUPABASE_URL = 
  safeGetEnv('VITE_SUPABASE_URL') || 
  safeGetEnv('REACT_APP_SUPABASE_URL') || 
  '';

export const SUPABASE_ANON_KEY = 
  safeGetEnv('VITE_SUPABASE_ANON_KEY') || 
  safeGetEnv('REACT_APP_SUPABASE_ANON_KEY') || 
  '';

export const SUPABASE_SERVICE_ROLE_KEY = 
  safeGetEnv('VITE_SUPABASE_SERVICE_ROLE_KEY') || 
  safeGetEnv('REACT_APP_SUPABASE_SERVICE_ROLE_KEY') || 
  '';

// Other environment variables
export const NODE_ENV = 
  safeGetEnv('MODE') || 
  safeGetEnv('NODE_ENV') || 
  'development';

export const IS_PROD = 
  safeGetEnv('PROD') === 'true' || 
  NODE_ENV === 'production';

export const IS_DEV = 
  safeGetEnv('DEV') === 'true' || 
  NODE_ENV === 'development';

// Function to safely access any env variable with fallback
export function getEnv(key: string, fallback: string = ''): string {
  return safeGetEnv(key, fallback);
}

// Simplified environment access function
export function getEnvironment() {
  return {
    SUPABASE_URL,
    SUPABASE_ANON_KEY
  };
}

// Example of handling base paths for GitHub Pages
export const getBasePath = () => {
  return process.env.NODE_ENV === 'production' 
    ? '/Problem_solver' 
    : '';
};

// Use this when constructing URLs in your app 