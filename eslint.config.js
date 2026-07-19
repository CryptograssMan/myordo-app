import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'worker-configuration.d.ts']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    // SECURITY: TenantDB (worker/tenant-db.ts) is the ONLY module allowed
    // to call D1Database.prepare() directly. This is the enforcement
    // mechanism behind the confidentiality guarantee in architecture §3.1:
    // every tenant-scoped query must go through TenantDB, which injects
    // parish_id. A raw .prepare() call anywhere else in worker/ bypasses
    // that scoping entirely and is a cross-tenant data leak waiting to
    // happen. If you're hitting this rule, the fix is almost always to
    // add a new scoped method to TenantDB rather than querying directly.
    files: ['worker/**/*.ts'],
    ignores: ['worker/tenant-db.ts', 'worker/tenant-db.test.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: "CallExpression[callee.property.name='prepare']",
          message:
            'Raw D1 .prepare() calls are forbidden outside worker/tenant-db.ts. ' +
            'All tenant data access must go through the TenantDB class so parish_id ' +
            'scoping is enforced. Add a scoped method to TenantDB instead.',
        },
      ],
    },
  },
])
