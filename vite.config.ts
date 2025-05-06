// vite.config.js
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on mode
  const env = loadEnv(mode, process.cwd(), '');
  
  console.log('Building in mode:', mode);
  console.log('Base path:', env.VITE_SIMULATE_GH_PAGES === 'true' ? '/Problem_solver/' : '/');
  
  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    base: env.VITE_SIMULATE_GH_PAGES === 'true' ? '/Problem_solver/' : '/',
    server: {
      port: 3000,
      open: true,
      // Add more detailed logging
      hmr: {
        overlay: true,
      },
    },
    // Log more details during build
    logLevel: 'info',
    // Define process.env for code that might still use it
    define: {
      'process.env': { ...env },
    },
    // Configure preview server
    preview: {
      port: 5000,
      open: true,
    },
    build: {
      outDir: 'dist',
      sourcemap: true, // Enable for debugging
      target: 'es2015',
      rollupOptions: {
        output: {
          format: 'iife',
          manualChunks: {
            vendor: [
              'react', 
              'react-dom', 
              'react-router-dom'
            ]
          }
        }
      }
    }
  };
});