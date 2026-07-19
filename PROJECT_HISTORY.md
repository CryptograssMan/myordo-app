# myORDO — Project History

## What this is

myORDO is a B2B SaaS liturgical calendar + notes app for Catholic parishes
in the Philippines (Tagalog/English). Full architecture spec lives in
`docs/myORDO_architecture_v2.md` (or wherever it's placed — see note below).

Stack: React (Vite) + Cloudflare Workers (with Assets) + D1 (shared,
multi-tenant with enforced row-level scoping) + Queues + R2, deployed via
GitHub -> Cloudflare Workers Builds auto-deploy on push to `main`.

## Key architectural decision

Originally scoped as physical database-per-parish. Revised to a single
shared D1 database with application-enforced row-level tenant isolation,
because (a) Cloudflare D1 has no supported way to bind dynamically-created
databases to a Worker at runtime, and (b) the actual requirement was
logical isolation ("parish A must never see parish B's notes"), not
physical separation. This collapsed provisioning from a multi-step
distributed transaction to a few row inserts, and removed the auth /
backup / DNS complexity that came with per-tenant databases.

The isolation guarantee rests on: every tenant table has parish_id
NOT NULL; parish_id is derived only from the verified session via
parish_memberships, never from request input; ALL tenant data access
flows through one module (`TenantDB`); and the raw D1 binding is
confined to `auth-context.ts`, never reaching route handlers.

## Infra status

- GitHub repo: https://github.com/CryptograssMan/myordo-app (connected to
  Cloudflare via Workers Builds — auto-deploys `main` on push)
- Live URL: https://myordo-app.pinoywheatgrass.workers.dev
- D1 database: `myordo-db` (database_id: c8bed623-e7f8-46f0-a296-b860290c45d2),
  bound as `DB` in wrangler.jsonc
- Local dev: `npm run dev` uses Wrangler's local D1 emulation
  (`.wrangler/state`), NOT the remote database, by design

## Build status

- [x] Project scaffolded (React + Vite + Workers with Assets + TypeScript + ESLint)
- [x] GitHub <-> Cloudflare Workers Builds connected, auto-deploy confirmed working
- [x] D1 database created and bound as `DB`
- [x] Schema migrated locally: `migrations/0001_init.sql`
      (users, parishes, parish_memberships, liturgical_notes,
      note_revisions, provisioning_events)
- [x] `worker/tenant-db.ts` — the sole choke point for tenant-scoped
      D1 queries; every method binds `parish_id` from the constructor
- [x] `worker/auth-context.ts` — confines the raw `env.DB` binding;
      resolves session -> user -> parish_memberships -> constructs TenantDB
- [x] `worker/index.ts` — routes only ever receive `ctx.tenantDb`, never
      `env.DB` directly
- [x] Manually verified cross-tenant isolation with real seeded data:
      created parish-1/user-1/note-1 and parish-2/user-2/note-2, confirmed
      via curl that user-1 sees ONLY note-1 and user-2 sees ONLY note-2
- [x] Fixed `listNotesForDate` to return `.results` only (was leaking D1's
      internal `.all()` envelope — `success`/`meta`/`served_by` — to the client)
- [ ] NOT YET DONE: automated test for the isolation guarantee (currently
      only verified by hand via curl — needs to be a real Vitest test using
      `@cloudflare/vitest-pool-workers` so it runs in CI on every change)
- [ ] NOT YET DONE: lint rule / CI check forbidding `.prepare(` outside
      `tenant-db.ts` (architecture §8 "sacred infrastructure" requirement)
- [ ] NOT YET DONE: real Google OAuth. `auth-context.ts` currently stubs
      session verification via an `x-debug-user-id` header — THIS MUST
      NEVER SHIP TO PRODUCTION AS-IS
- [ ] NOT YET DONE: provisioning pipeline (PayMongo webhook -> Queue ->
      idempotent consumer, per architecture §5)
- [ ] NOT YET DONE: romcal integration, PWA/offline sync, note revisions
      UI, everything else in architecture §9 feature scope

## Known local dev quirks

- Port sometimes shifts from 5173 to 5174 if a previous dev server is
  still holding the port — check terminal output for the actual port
  in use.
- `pentecost-app` (a separate, earlier project, unrelated to myORDO)
  lives alongside this one in ~/Projects — don't confuse the two.

## How to resume local dev

    cd ~/Projects/myordo-app
    npm run dev

Test the API locally (once dev server is up):

    npx wrangler d1 execute myordo-db --local --command "SELECT * FROM parishes;"
    curl -i -H "x-debug-user-id: user-1" "http://localhost:5173/api/notes?date=2026-07-19"

Seeded local test data (parish-1/user-1/note-1 and parish-2/user-2/note-2)
already exists in the local D1 instance as of this session — see the
session-handoff file for exact seed SQL if it needs to be recreated.


## Vitest / D1 gotchas hit this session (worth remembering)

- `@cloudflare/vitest-pool-workers` >=0.13 changed its config API:
  `defineWorkersConfig` from `/config` is gone. Use the `cloudflareTest()`
  Vite plugin from the package root instead, with plain `defineConfig`
  from `vitest/config`. Also import `env` from `cloudflare:workers`, not
  `cloudflare:test` (that module was removed in this version range).
- `D1Database.exec()` splits input by newline and expects one statement
  per line -- it cannot run a nicely multi-line-formatted CREATE TABLE.
  Use `.prepare(sql).run()` instead, which treats the whole string as
  one statement regardless of formatting.
- D1 storage in `@cloudflare/vitest-pool-workers` persists across all
  tests within the same test FILE (isolation is per-file, not per-test).
  A `beforeEach` that just re-INSERTs seed data will hit UNIQUE constraint
  violations on the second test. Fix: DROP TABLE IF EXISTS before each
  CREATE in the schema setup, so every test starts from a真正 clean slate.

## Vitest / D1 gotchas hit this session (worth remembering)

- `@cloudflare/vitest-pool-workers` >=0.13 changed its config API:
  `defineWorkersConfig` from `/config` is gone. Use the `cloudflareTest()`
  Vite plugin from the package root instead, with plain `defineConfig`
  from `vitest/config`. Also import `env` from `cloudflare:workers`, not
  `cloudflare:test` (that module was removed in this version range).
- `D1Database.exec()` splits input by newline and expects one statement
  per line -- it cannot run a nicely multi-line-formatted CREATE TABLE.
  Use `.prepare(sql).run()` instead, which treats the whole string as
  one statement regardless of formatting.
- D1 storage in `@cloudflare/vitest-pool-workers` persists across all
  tests within the same test FILE (isolation is per-file, not per-test).
  A `beforeEach` that just re-INSERTs seed data will hit UNIQUE constraint
  violations on the second test. Fix: DROP TABLE IF EXISTS before each
  CREATE in the schema setup, so every test starts from a genuinely
  clean slate.
