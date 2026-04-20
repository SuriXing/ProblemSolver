module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
    'plugin:react/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
    // Local rule loaded via --rulesdir eslint-rules. Ratcheted to 'error' —
    // repo has zero warnings at time of promotion.
    'no-missing-i18n-key': 'error',
    // Storage layer and migration scripts intentionally use `any` for
    // serialized JSON shape-shifting. Tightening this is a separate unit;
    // for now keep correctness rules (unused-vars, hooks) strict and skip
    // this stylistic one.
    '@typescript-eslint/no-explicit-any': 'off',
    // Allow underscore-prefixed unused as intentional (state setters kept
    // for future wiring, etc.).
    '@typescript-eslint/no-unused-vars': [
      'warn',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_', destructuredArrayIgnorePattern: '^_' },
    ],
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  overrides: [
    {
      // Test files are full of intentional no-op stubs like `() => {}`.
      files: ['**/*.test.{ts,tsx}', '**/__tests__/**/*.{ts,tsx}', 'src/test/**/*.{ts,tsx}'],
      rules: {
        '@typescript-eslint/no-empty-function': 'off',
        // Test files use `!` freely after `expect(x).toBeDefined()` — the
        // assertion is the null-check. Enforcing this adds noise, not safety.
        '@typescript-eslint/no-non-null-assertion': 'off',
        // Test helpers commonly import vi/beforeEach for type narrowing or
        // future use; unused imports in tests don't ship to users.
        '@typescript-eslint/no-unused-vars': 'off',
        // test-utils.tsx re-exports both components and helpers — that's the
        // whole point of a test-utils file. Fast-refresh doesn't apply.
        'react-refresh/only-export-components': 'off',
      },
    },
    {
      // Context providers conventionally export both the Provider component
      // and the consumer hook from the same file. Splitting them is a churn
      // not a fix. Same for pages that export route loader helpers.
      files: [
        'src/context/**/*.tsx',
        'src/components/pages/AccessCodeNotebook.tsx',
      ],
      rules: {
        'react-refresh/only-export-components': 'off',
      },
    },
  ],
} 