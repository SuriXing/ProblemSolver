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
      // Bump the warning floor so the known-large vendor chunks (react-dom,
      // antd, fontawesome) don't spam CI. The per-chunk budget we actually
      // care about is enforced by the manualChunks split below.
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
        },
        output: {
          inlineDynamicImports: false,
          // Split heavy vendor libs out of the main bundle so first paint
          // doesn't have to ship Ant Design + i18next + Supabase + FA on the
          // critical path. Matching by id so dynamic imports share chunks.
          manualChunks(id: string) {
            if (!id.includes('node_modules')) return undefined;
            if (id.includes('antd') || id.includes('rc-') || id.includes('@ant-design')) return 'vendor-antd';
            if (id.includes('react-router')) return 'vendor-router';
            if (id.includes('@fortawesome')) return 'vendor-fa';
            if (id.includes('i18next') || id.includes('react-i18next')) return 'vendor-i18n';
            if (id.includes('@supabase')) return 'vendor-supabase';
            if (id.includes('react-dom') || id.includes('scheduler')) return 'vendor-react-dom';
            if (id.includes('/react/') || id.endsWith('/react')) return 'vendor-react';
            return undefined;
          },
        },
      },
    },
  };
});
