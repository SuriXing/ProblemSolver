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
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  overrides: [
    {
      // Test files are full of intentional no-op stubs like `() => {}`.
      files: ['**/*.test.{ts,tsx}', '**/__tests__/**/*.{ts,tsx}'],
      rules: {
        '@typescript-eslint/no-empty-function': 'off',
      },
    },
  ],
} 