// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // For GitHub Pages deployment
  base: process.env.SIMULATE_GH_PAGES === 'true' 
    ? '/Problem_solver/' 
    : '/',
  // Configure server options
  server: {
    port: 3000,
    open: true,
  },
  // Configure preview server
  preview: {
    port: 5000,
    open: true,
  },
});