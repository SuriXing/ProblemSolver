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
    base: '/',
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
      sourcemap: false, // Disabled: leaks source + string literals in prod
      target: 'es2015',
      // antd ships ~919KB / 288KB gzip as a single vendor chunk. Off the
      // critical path (lazy-loaded with consumer routes), but still big.
      // Bumping the warning so CI doesn't spam — followup P1.3 should audit
      // antd subpath imports / consider babel-plugin-import to shrink it.
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
        },
        output: {
          inlineDynamicImports: false,
          // Split heavy vendor libs out of the main bundle so first paint
          // doesn't have to ship Ant Design + i18next + Supabase + FA on the
          // critical path. Path-anchored matches so we don't accidentally
          // catch e.g. `@types/react` (P1.2 review fix).
          manualChunks(id: string) {
            if (!id.includes('/node_modules/')) return undefined;
            if (/[\\/]node_modules[\\/](antd|@ant-design|rc-[^\\/]+)[\\/]/.test(id)) return 'vendor-antd';
            if (/[\\/]node_modules[\\/](react-router|react-router-dom)[\\/]/.test(id)) return 'vendor-router';
            if (/[\\/]node_modules[\\/]@fortawesome[\\/]/.test(id)) return 'vendor-fa';
            if (/[\\/]node_modules[\\/](i18next|react-i18next|i18next-[^\\/]+)[\\/]/.test(id)) return 'vendor-i18n';
            if (/[\\/]node_modules[\\/]@supabase[\\/]/.test(id)) return 'vendor-supabase';
            if (/[\\/]node_modules[\\/](react-dom|scheduler)[\\/]/.test(id)) return 'vendor-react-dom';
            if (/[\\/]node_modules[\\/]react[\\/]/.test(id)) return 'vendor-react';
            return undefined;
          },
        },
      },
    },
  };
});
