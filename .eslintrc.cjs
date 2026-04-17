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
    // Local rule loaded via --rulesdir eslint-rules. Warn initially so repo
    // passes lint; ratchet to 'error' after fixing existing drift.
    'no-missing-i18n-key': 'warn',
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
} 