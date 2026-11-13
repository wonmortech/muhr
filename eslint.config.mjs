// SPDX-FileCopyrightText: 2026 Wonmor and Muhr contributors
// SPDX-License-Identifier: Apache-2.0

// ESLint flat config. `npm run lint` runs it with --max-warnings 0, so every finding fails CI.
import js from '@eslint/js'
import globals from 'globals'

const rules = {
  // CONTRIBUTING.md: no code built from strings, strict comparisons, no dead variables.
  'no-eval': 'error',
  'no-implied-eval': 'error',
  'no-new-func': 'error',
  'no-unused-vars': 'error',
  eqeqeq: ['error', 'smart']
}

export default [
  { ignores: ['node_modules/', 'test-results/', 'playwright-report/', '.qa/', '.coverage/', 'coverage/'] },
  js.configs.recommended,
  {
    // The site: classic scripts loaded by <script src>, run in the browser.
    files: ['site/**/*.js'],
    languageOptions: { ecmaVersion: 2022, sourceType: 'script', globals: { ...globals.browser } },
    rules
  },
  {
    // core.js is also loaded by Node for the unit tests (UMD-style export).
    files: ['site/assets/core.js'],
    languageOptions: { globals: { module: 'readonly' } }
  },
  {
    // Tests, tools and configs: ES modules run by Node.
    files: ['**/*.mjs'],
    languageOptions: { ecmaVersion: 'latest', sourceType: 'module', globals: { ...globals.node } },
    rules
  },
  {
    // Code inside page.evaluate() runs in the browser.
    files: ['tests/e2e/**/*.mjs'],
    languageOptions: { globals: { ...globals.browser } }
  }
]
