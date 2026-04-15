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
      // vitest 0.30 + @vitest/coverage-c8 reads thresholds as FLAT keys —
      // the nested `thresholds: { ... }` form arrived in vitest ≥1.0 and is
      // silently ignored on 0.30. Keep flat until D2 upgrades vitest.
      // These are RATCHET FLOORS, not aspirational targets — set to current
      // measured coverage so any regression fails CI. C2/A1 will raise them.
      lines: 85,
      branches: 75,
      functions: 70,
      statements: 85,
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
}); 
