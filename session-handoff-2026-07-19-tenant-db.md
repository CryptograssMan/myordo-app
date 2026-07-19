# Session handoff — 2026-07-19 — TenantDB spine built + isolation verified

## What happened this session

Started from an empty directory, scaffolded the whole project, connected
GitHub -> Cloudflare, created D1, wrote and applied the initial schema,
then built and manually verified the core security architecture: the
`TenantDB` enforcement layer and the `auth-context.ts` module that
confines the raw D1 binding.

## Exact current file state

`worker/tenant-db.ts` — exports `TenantDB` class. Constructor takes
`(db: D1Database, parishId: string)`, throws if parishId is empty.
Instance methods `listNotesForDate(date, userId)` and `createNote(input)`
both bind `this.parishId` into their WHERE/INSERT. Also exports a static
`TenantDB.findMembershipsForUser(db, userId)` — the one deliberate
unscoped query, used only by auth-context.ts before a parishId exists.

`worker/auth-context.ts` — exports `resolveRequestContext(request, env)`.
Pipeline: `verifySession()` (currently a STUB reading `x-debug-user-id`
header, NOT real auth) -> `TenantDB.findMembershipsForUser` -> takes the
first active membership (multi-parish selection UI not built yet) ->
constructs and returns `TenantDB` instance plus userId/parishId/role.
Throws `AuthError` (401 no session / 403 no membership) on failure.

`worker/index.ts` — bare fetch handler. Catches `AuthError` and returns
the right status. Only wired route so far: `GET /api/notes?date=...`,
calls `ctx.tenantDb.listNotesForDate(date, ctx.userId)`.

## The test that was run (manually, NOT yet automated)

Seeded via `wrangler d1 execute myordo-db --local --command "..."`:

    parish-1 (St. Jude Test Parish) / user-1 / mem-1 (admin) / note-1
      ("St. Jude homily draft" / parish_public)
    parish-2 (St. Peter Test Parish) / user-2 / mem-2 (admin) / note-2
      ("St. Peter homily draft" / parish_public)

Then:

    curl -s -H "x-debug-user-id: user-1" "http://localhost:5173/api/notes?date=2026-07-19"
    curl -s -H "x-debug-user-id: user-2" "http://localhost:5173/api/notes?date=2026-07-19"

Result: user-1's response contained ONLY note-1. user-2's response
contained ONLY note-2. No cross-tenant leakage in either direction.
This is the core confidentiality guarantee from architecture §3.1,
demonstrated against real D1 rows, not just asserted from the code.

## Immediate next step (where we stopped)

About to check whether a test runner exists yet:

    cat package.json | grep -A3 '"scripts"'
    ls node_modules/.bin | grep -i vitest

Expectation: none exists yet (scaffold doesn't include one by default).
Next action was going to be installing Vitest + `@cloudflare/vitest-pool-workers`
(Cloudflare's official way to run tests inside real workerd against a real
ephemeral D1 instance) and writing `worker/tenant-db.test.ts` to codify
the exact manual test above as a permanent, CI-runnable regression test.

## Other things flagged as not-yet-done (see PROJECT_HISTORY.md)

- Lint rule / CI check forbidding `.prepare(` outside tenant-db.ts
- Real Google OAuth (auth-context.ts session verification is a header stub)
- Provisioning pipeline (PayMongo webhook -> Queue -> idempotent consumer)
- Everything else in feature scope (romcal, offline sync, PWA, etc.)
