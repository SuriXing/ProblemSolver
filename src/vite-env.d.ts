/// <reference types="vite/client" />

interface ImportMetaEnv {
  [key: string]: string | undefined;
  // Add known environment variables here
  VITE_SUPABASE_URL: string;
  VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_SUPABASE_SERVICE_ROLE_KEY: string;
  // Add other environment variables as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
} 