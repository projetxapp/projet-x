// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettierConfig = require('eslint-config-prettier');

module.exports = defineConfig([
  expoConfig,
  prettierConfig,
  {
    ignores: [
      'dist/*',
      '.expo/*',
      'coverage/*',
      'playwright-report/*',
      'test-results/*',
      'supabase/functions/*',
      'src/types/database.ts',
    ],
  },
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  {
    rules: {
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      // French copy is full of apostrophes; React Native <Text> renders them as-is.
      'react/no-unescaped-entities': 'off',
    },
  },
  {
    files: ['scripts/**', 'tests/**', 'supabase/load/**'],
    rules: { 'no-console': 'off' },
  },
]);
