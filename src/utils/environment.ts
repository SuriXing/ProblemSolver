/**
 * Centralized environment variable access for Vite
 */

// Define types for environment variables
interface ImportMetaEnv {
  VITE_SUPABASE_URL: string;
  VITE_SUPABASE_ANON_KEY: string;
  VITE_SUPABASE_SERVICE_ROLE_KEY?: string;
  MODE: string;
  DEV: boolean;
  PROD: boolean;
  SSR: boolean;
  [key: string]: any;
}

// Simplified access to environment variables
const env: ImportMetaEnv = import.meta.env;

// Supabase configuration
export const SUPABASE_URL = env.VITE_SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY || '';
export const SUPABASE_SERVICE_ROLE_KEY = env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';

// Environment information
export const NODE_ENV = env.MODE || 'development';
export const IS_PROD = env.PROD || NODE_ENV === 'production';
export const IS_DEV = env.DEV || NODE_ENV === 'development';

// Function to safely access any env variable with fallback
export function getEnv(key: string, fallback: string = ''): string {
  const fullKey = key.startsWith('VITE_') ? key : `VITE_${key}`;
  return env[fullKey] || fallback;
}

// Example of handling base paths for GitHub Pages
export const getBasePath = () => {
  return '/Problem_solver';
};

// Simplified environment access function
export function getEnvironment() {
  return {
    SUPABASE_URL,
    SUPABASE_ANON_KEY
  };
} 