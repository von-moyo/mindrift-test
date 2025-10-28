import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import jestPlugin from 'eslint-plugin-jest'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 'latest',
      globals: { ...globals.browser, ...globals.node },
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
    },
  },
  {
    // Override for test files
    files: ['**/*.test.{js,jsx}', '**/__tests__/**/*.{js,jsx}', 'src/setupTests.js', 'src/__mocks__/**/*.js'],
    plugins: { jest: jestPlugin },
    languageOptions: {
      globals: { ...globals.jest, ...globals.node, ...globals.browser },
    },
    rules: {
      'no-undef': 'off',
      'no-unused-vars': 'off',
      'react-refresh/only-export-components': 'off',
    },
  },
])
