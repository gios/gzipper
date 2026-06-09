// @ts-check

import { defineConfig } from 'eslint/config';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import vitest from '@vitest/eslint-plugin';

export default defineConfig([
  {
    files: ['**/*.{js,ts}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.strict,
      tseslint.configs.stylistic,
    ],
    ignores: ['dist/'],
  },
  {
    files: ['test/**'],
    plugins: {
      vitest,
    },
    rules: {
      ...vitest.configs.recommended.rules,
    },
  },
]);
