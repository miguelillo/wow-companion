import { defineConfig } from 'eslint/config';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import astro from 'eslint-plugin-astro';

export default defineConfig(
  { ignores: ['dist/**', '.astro/**', 'node_modules/**', 'src/data/*.json'] },
  js.configs.recommended,
  tseslint.configs.recommended,
  astro.configs.recommended,
  astro.configs['jsx-a11y-recommended'],
  {
    rules: {
      // The project bans `any` outright: strict types are the contract with the addon.
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
  {
    // The Astro config and the build scripts run in Node, not in the browser.
    files: ['*.config.mjs', 'scripts/**/*.ts'],
    languageOptions: {
      globals: { process: 'readonly', console: 'readonly', fetch: 'readonly', URL: 'readonly' },
    },
  },
  {
    // Build-time scripts legitimately log progress to stdout.
    files: ['scripts/**/*.ts'],
    rules: { 'no-console': 'off' },
  },
);
