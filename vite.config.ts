// vite.config.js
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on mode
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    base: './',
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
          inlineDynamicImports: false,
        }
      }
    }
  };
});
