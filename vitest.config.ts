import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/.claude/**', '**/cypress/**', '**/e2e/**'],
    coverage: {
      provider: 'c8',
      reporter: ['text', 'json', 'html', 'text-summary'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.d.ts',
        'src/test/**',
        'src/vite-env.d.ts',
        'src/react-app-env.d.ts',
        'src/react-i18next.d.ts',
        'src/types/**',
        'src/locales/**',
        'src/assets/**',
        'src/styles/**',
        'src/**/*.css',
      ],
      thresholds: {
        lines: 85,
        branches: 75,
        functions: 75,
        statements: 85,
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
}); 
