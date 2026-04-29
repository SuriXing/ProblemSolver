/**
 * Centralized environment variable access for Vite.
 *
 * ⚠️  Security: anon key is public-safe; service-role key MUST NOT live on a
 * VITE_ variable — Vite bundles VITE_* into client JS, which would ship a
 * key that bypasses RLS to every visitor.
 *
 * C1.1: dropped the legacy `getEnv(key)` and `getEnvironment()` helpers.
 * They were thin wrappers around this module's own exports and invited
 * string-typo bugs (`getEnv('SUBASE_URL')` returns '' silently). Import the
 * named constants directly.
 */

interface ImportMetaEnv {
  VITE_SUPABASE_URL: string;
  VITE_SUPABASE_ANON_KEY: string;
  MODE: string;
  DEV: boolean;
  PROD: boolean;
  SSR: boolean;
  [key: string]: any;
}

const env: ImportMetaEnv = import.meta.env;

export const SUPABASE_URL = env.VITE_SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY || '';

export const NODE_ENV = env.MODE || 'development';
export const IS_PROD = env.PROD || NODE_ENV === 'production';
export const IS_DEV = env.DEV || NODE_ENV === 'development';
