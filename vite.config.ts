// vite.config.js
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const simulateGithubPages = process.env.SIMULATE_GH_PAGES === 'true';

export default defineConfig(({ mode }) => {
  // Load env variables for the current mode
  const env = loadEnv(mode, process.cwd());
  
  return {
    plugins: [react()],
    // Keep default environment variable config
    envPrefix: 'VITE_',
    
    // Define for compatibility with CRA
    define: {
      'process.env.NODE_ENV': JSON.stringify(mode),
      'process.env.REACT_APP_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
      'process.env.REACT_APP_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY),
      'process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY': JSON.stringify(env.VITE_SUPABASE_SERVICE_ROLE_KEY),
    },
    
    // Conditionally set the base path based on environment
    base: mode === 'production' || simulateGithubPages ? '/Problem_solver/' : '/',
  };
});