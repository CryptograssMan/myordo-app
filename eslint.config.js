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
    // to call D1Database.prepare() for TENANT-SCOPED data. This is the
    // enforcement mechanism behind the confidentiality guarantee in
    // architecture §3.1: every tenant-scoped query must go through
    // TenantDB, which injects parish_id. A raw .prepare() call anywhere
    // else bypasses that scoping and is a cross-tenant data leak waiting
    // to happen. If you're hitting this rule, the fix is almost always to
    // add a new scoped method to TenantDB rather than querying directly.
    //
    // EXEMPTIONS (ignores below):
    //  - tenant-db.ts        : the choke point itself.
    //  - tenant-db.test.ts   : seeds/resets schema directly for tests.
    //  - google-auth.ts      : session + user-identity queries that are
    //                          NOT parish-scoped -- they run BEFORE a
    //                          parish (and thus a TenantDB) is known.
    //                          These touch `sessions` and `users` by
    //                          id/email, never tenant data by parish_id.
    //  - super-admin-db.ts   : the deliberate cross-parish path for the
    //                          super-admin console (architecture §3.4).
    //                          Small, single-purpose, self-audited; never
    //                          selects note title/body.
    files: ['worker/**/*.ts'],
    ignores: [
      'worker/tenant-db.ts',
      'worker/tenant-db.test.ts',
      'worker/google-auth.ts',
    'worker/auth-routes.ts',
    'worker/super-admin-db.ts',
    ],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: "CallExpression[callee.property.name='prepare']",
          message:
            'Raw D1 .prepare() calls are forbidden outside the approved data-access modules ' +
            '(tenant-db.ts for tenant data, google-auth.ts for session/identity). All tenant ' +
            'data access must go through the TenantDB class so parish_id scoping is enforced. ' +
            'Add a scoped method to TenantDB instead.',
        },
      ],
    },
  },
])
