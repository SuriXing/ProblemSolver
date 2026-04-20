// ESLint v9 flat config. Migrated from .eslintrc.cjs during D2.1 group 4.
// --rulesdir is gone in v9, so the local rule is wired as a tiny inline plugin.
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactPlugin from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import localRules from './eslint-rules/index.js';

const localPlugin = {
  rules: localRules.rules,
};

export default [
  { ignores: ['dist/**', 'node_modules/**', 'coverage/**', '**/*.cjs', 'public/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.es2020 },
      parser: tseslint.parser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      local: localPlugin,
    },
    settings: {
      react: { version: 'detect' },
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'local/no-missing-i18n-key': 'error',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          // ts-eslint v8 now flags `catch (error)` by default. Keep existing
          // convention — don't churn code to silence this.
          caughtErrors: 'none',
        },
      ],
    },
  },
  {
    // Test files — relax a few rules that are noisy in tests.
    files: [
      'src/**/*.test.{ts,tsx}',
      'src/**/__tests__/**/*.{ts,tsx}',
      'src/test/**/*.{ts,tsx}',
    ],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'react-refresh/only-export-components': 'off',
    },
  },
  {
    // Context providers & the Notebook intentionally export hooks + components
    // from the same file — documented exceptions from the old config.
    files: [
      'src/context/**/*.tsx',
      'src/components/pages/AccessCodeNotebook.tsx',
    ],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
];
