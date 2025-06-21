/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Custom environment variables
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_SUPABASE_SERVICE_ROLE_KEY: string;
  
  // Built-in Vite environment variables
  readonly MODE: string;
  readonly BASE_URL: string;
  readonly PROD: boolean;
  readonly DEV: boolean;
  
  // Allow for dynamic access using string indexing
  readonly [key: string]: string | boolean | undefined;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
} 