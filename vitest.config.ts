import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/.claude/**', 'e2e/**'],
    coverage: {
      provider: 'v8',
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
      // vitest 2 requires thresholds NESTED under `thresholds`. The flat
      // form was the pre-1.0 shape — silently ignored after D2.1 upgrade.
      // These are RATCHET FLOORS — any regression fails CI.
      thresholds: {
        lines: 85,
        branches: 75,
        functions: 69,
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
