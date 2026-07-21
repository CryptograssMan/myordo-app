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
- [x] Automated cross-tenant isolation test: `worker/tenant-db.test.ts`,
      using Vitest + `@cloudflare/vitest-pool-workers` (0.18.6 / vitest 4.1.10).
      Runs 3 tests against real D1 inside workerd: isolation guarantee,
      constructor guard, membership scoping. `npm test` to run. See the
      "Vitest / D1 gotchas" section below for setup issues hit along the way.
- [x] Lint rule / build gate forbidding `.prepare(` outside `tenant-db.ts`
      (architecture §8 "sacred infrastructure" requirement). ESLint's
      `no-restricted-syntax` fires on any `.prepare()` call in `worker/**/*.ts`
      except `tenant-db.ts` and its test file. Chained into `npm run build`
      (`eslint . && tsc -b && vite build`), which is the exact command
      Cloudflare's Workers Build runs -- so a violation fails the deploy,
      not just a local lint pass. Verified by deliberately adding a raw
      `.prepare()` call outside the choke point, confirming both
      `npm run lint` and `npm run build` failed with a clear message, then
      reverting and confirming both passed clean again.
- [x] Real Google OAuth — DONE and verified in production (2026-07-19).
      Invite-only per §5: `google-auth.ts` (OAuth code flow + D1 session
      cookies), `auth-routes.ts` (/auth/google/login|callback|logout via
      Hono, binds Google identity to a pre-seeded parish_memberships row,
      flips invited->active, rejects non-invited emails), `auth-context.ts`
      (session cookie -> user -> parish -> TenantDB). `index.ts` is now Hono
      with `run_worker_first` for /auth/* + /api/*. Migration 0002 added the
      sessions table. Verified: logged in as claravall.family@gmail.com
      (seeded as invited admin of beta-parish), membership flipped to active,
      /api/me and /api/notes resolved through the real session cookie.
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
  CREATE in the schema setup, so every test starts from a genuinely
  clean slate.

## Beta scope decision (2026-07-19) — read this before touching provisioning/payments/compliance

Goal: get ONE beta parish using the real product for free, to learn fast,
before building anything payment-related. This deliberately defers large
chunks of the original architecture doc. If you're an agent picking up
this project, do NOT build the deferred items below unless explicitly
asked — they are out of scope until beta feedback justifies them.

### Deferred until post-beta (do not build yet)

- PayMongo integration, webhook handler, Queue consumer (architecture §5).
  The entire provisioning pipeline is replaced by a MANUAL seed: one
  `parishes` row + `parish_memberships` rows inserted directly via
  `wrangler d1 execute`, the same way we seeded test data in this session.
- Admin self-serve invite UI. Staff rows are seeded by hand for the beta.
- Vanity subdomain / per-parish branding polish. One parish, default
  styling is fine.
- Full compliance paperwork (privacy policy, DPO, NPC registration,
  subprocessor terms — architecture §12). EXCEPTION: still ship the
  one-line acceptable-use / data-minimization notice from §5 even in
  beta — cheap to add, real insurance once real pastoral notes exist.
- Tagalog feast-name content workstream (architecture §11/§9). English
  labels only for beta.
- Lectionary/reading-text licensing decision (architecture §11). Citations
  + links only, as already scoped for Phase 1 — no change needed, just
  confirming this isn't a beta blocker.
- Robustness polish on offline conflict resolution (architecture §6) can
  be simplified for a single small beta parish (3-10 users) — collision
  risk is low at that scale. Do NOT skip the server-assigned `updated_at`
  and append-only `note_revisions` mechanism itself (already built into
  the schema) — that stays. Just don't over-invest in edge-case UI for
  conflicts nobody will hit yet.

### Required for beta (build these)

1. Real Google OAuth (in progress as of this entry — see "Google OAuth"
   section below). Replaces the `x-debug-user-id` header stub in
   auth-context.ts. This is the one item from the original architecture
   that is NOT deferred — a beta parish needs real login.
2. Manual seed data for the beta parish itself (one parishes row, one
   parish_memberships row per staff member) once OAuth is working —
   no pipeline, just direct D1 inserts.
3. romcal integration — client-side liturgical calendar engine, month/week
   view, day detail modal (rank, color, feast name, lectionary citation).
   This is the actual product surface; nothing exists yet beyond the one
   GET /api/notes route.
4. Notes UI — create/edit/list private and parish-public notes against a
   date, wired to the existing (and soon-to-be-expanded) TenantDB-backed
   API. The backend logic exists; no frontend exists yet.
5. Basic PWA shell — offline app-shell caching (Vite PWA Plugin, per
   architecture §2) so it behaves like an installed app. Full sync
   robustness can wait; the app-shell caching itself should not.
6. Deploy, seed the real beta parish, walk them through first login,
   fix what breaks.

### Rough session-by-session estimate (given to the human, logged for continuity)

- Phase A: finish OAuth (in progress)
- Phase B: manual beta-parish seed data (~30 min)
- Phase C: romcal + calendar UI (1-2 sessions)
- Phase D: notes UI (1 session)
- Phase E: PWA shell + offline basics (1 session)
- Phase F: seed real parish, walk-through, fix issues (1 session)

Treat this as a floor, not a promise — this session alone hit several
unpredictable tooling snags (vitest-pool-workers API changes, tsc build
flags, D1 API quirks) that ate real time despite being "just setup."

## ✅ RESOLVED (2026-07-20) — remote D1 migrations applied, beta parish live on prod

Throughout this project we have ONLY run `npm run db:migrate:local`. The
REMOTE (production) D1 database has had NO migrations applied — not even
0001. This means:

- The live Worker at https://myordo-app.pinoywheatgrass.workers.dev has
  the code deployed, but its production D1 has NO tables. Any real login
  or API call against prod will 500.
- This is fine for now: beta testing runs locally, and no parish is
  pointed at prod yet.

BEFORE anyone logs into the production URL (i.e. before the beta parish
is onboarded), apply migrations to remote:

    npm run db:migrate:remote   # applies 0001 + 0002 to the real prod D1

This is a REAL production database change — review the migration files
first, and expect the same interactive "your database may not be
available during migration" confirmation. After applying, the prod
beta-parish + membership seed rows also need to be inserted against
--remote (they currently only exist in local D1). See the OAuth section
for the seed pattern (parishes + parish_memberships row, status
'invited', user_id NULL, keyed to the beta admin's real Google email).

Also confirm the production OAuth redirect URI is registered in Google
Cloud console: https://myordo-app.pinoywheatgrass.workers.dev/auth/google/callback
(the localhost one is already there and verified; the prod one should be
too from initial setup, but verify before the first prod login).

## Phase B complete (2026-07-20) — beta parish seeded, first prod login verified

- Migrations 0001 + 0002 applied to REMOTE (production) D1 via
  `npm run db:migrate:remote`. Confirmed via `sqlite_master` query that
  all 7 tables exist on prod (previously the deploy blocker above).
- `beta-parish` created on BOTH local and remote D1, with 7 seeded
  `parish_memberships` rows (status 'invited', user_id NULL until first
  login): claravall.family@gmail.com (admin), redmaroon1989@gmail.com
  (admin), daquisrjr61883@gmail.com (admin), cristobalyang70@gmail.com
  (admin), gjoel2455@gmail.com (staff), rochelledrosella@gmail.com
  (staff), glenn.claravall@gmail.com (admin).
- FIRST REAL PRODUCTION LOGIN VERIFIED: claravall.family@gmail.com logged
  in at https://myordo-app.pinoywheatgrass.workers.dev/auth/google/login,
  membership flipped invited -> active with user_id
  71694690-6ccc-4e5b-9664-6c9835082eda bound, confirmed matching via
  both GET /api/me and a direct `wrangler d1 execute --remote` query.
- One transient `invalid_state` error was seen on an earlier attempt
  (likely a stale oauth_state cookie from a partial/repeated attempt,
  e.g. browser back button or a reused tab) -- resolved itself on a
  clean attempt starting fresh at /auth/google/login. Not a code bug;
  no fix needed unless it recurs.
- REMAINING before other 6 people can log in: each of their emails must
  be added as a Google OAuth "test user" in the Google Cloud console
  (APIs & Services -> OAuth consent screen -> Test users) -- the app is
  in Testing mode, so Google blocks any non-test-user account before it
  ever reaches our invite gate. This has only been confirmed done for
  claravall.family@gmail.com (the one that just logged in successfully).

Phase B is functionally done. Next up per the beta roadmap: Phase C
(romcal + calendar UI) -- the first real visible product surface.

## Phase C progress (2026-07-21) — liturgical calendar engine + CBCP corrections

- romcal@dev + @romcal/calendar.philippines@dev installed, wrapped in
  src/lib/liturgicalCalendar.ts (client-side, English, Philippines_En).
  Exposes a trimmed LiturgicalDayView shape; UI never touches romcal's
  internal object directly.
- CBCP CORRECTIONS LAYER (src/lib/philippineCorrections.ts) — implements
  architecture §13. romcal's PH plugin lags the official CBCP calendar
  (effective 1 Dec 2024 / LY2025):
    * San Pedro Calungsod: ADDED on Oct 21 as a Feast (romcal omits him;
      CBCP moved him April 2 -> Oct 21 and elevated to Feast).
    * San Lorenzo Ruiz: UPGRADED Sept 28 memorial -> Feast.
  Data-driven; further CBCP-diff findings slot in without code changes.
- vitest split into two projects: 'workers' (cloudflare pool) and 'node'
  (plain node, for romcal/pure-logic tests). 9/9 tests pass.
- UPSTREAM CONTRIBUTION PENDING: a romcal GitHub issue reporting both
  corrections is drafted and ready but NOT YET FILED. Draft text saved in
  docs-romcal-contribution-draft.md. To be filed manually by the human
  (CryptograssMan) at https://github.com/romcal/romcal/issues/new. Once
  filed, record the issue URL here and in that draft file. If romcal later
  merges the fix, our local override in philippineCorrections.ts can be
  dropped.
- NOT YET DONE in Phase C: the actual calendar UI (month/week views, day
  detail modal). The engine is built and verified; no visible calendar
  screen exists yet. romcal's true client-side bundle cost is still
  unmeasured (it won't show until we import it into the React app).

## Canonical production domain (2026-07-21)

myordo.cenaclelabs.com is the ONE canonical production domain — NOT the
myordo-app.pinoywheatgrass.workers.dev subdomain that appears throughout
earlier history. The .workers.dev URL still resolves (it's the Worker's
default) but humans should always use myordo.cenaclelabs.com.

- The custom domain was already attached to the Worker (Cloudflare dash ->
  Workers -> myordo-app -> Domains, cenaclelabs.com zone), but APP_BASE_URL
  in wrangler.jsonc still pointed at .workers.dev. That mismatch caused
  OAuth invalid_state errors: the app served on cenaclelabs.com but the
  callback redirected to .workers.dev, so the oauth_state cookie didn't
  travel across domains. Fixed by pointing APP_BASE_URL at
  https://myordo.cenaclelabs.com.
- Google OAuth client now has these Authorized redirect URIs:
  https://myordo.cenaclelabs.com/auth/google/callback (canonical),
  http://localhost:5173/auth/google/callback (local dev). The old
  .workers.dev callback URI can be removed later; harmless to leave.
- Local dev is unchanged: .dev.vars overrides APP_BASE_URL to
  http://localhost:5173, so localhost login still works.
- Verified: fresh login as claravall.family@gmail.com on
  https://myordo.cenaclelabs.com works end-to-end, no invalid_state.

## Phase C + D complete (2026-07-21) — calendar UI + notes, deployed to prod

### ✅ Remote migration blocker RESOLVED
Migration 0003 (last_edited_by_user_id) is now applied to REMOTE production
D1. Prod D1 is current through 0003. (Symptom before fix: notes query 500'd
on prod because the deployed code referenced a column prod's DB lacked.)
Reminder for future migrations: after `npm run db:migrate:local`, ALSO run
`npm run db:migrate:remote` before testing that feature on the live domain.

### Phase C — Liturgical calendar UI (DONE, deployed)
- Month-grid calendar (week starts Sunday) where liturgical color is the
  signature visual system: each day has a colored spine + soft wash from its
  canonical color; ranked days show feast names; season label under the
  month title. Warm-paper ecclesiastical design. src/MonthGrid.tsx/.css.
- romcal + PH plugin lazy-loaded via dynamic import() (first paint ~62kB
  gzip; romcal ~850kB streams in behind a loading state).

### Phase D — Notes (DONE, deployed)
- Day-detail side panel (src/DayPanel.tsx/.css): click a day -> panel slides
  in with liturgical header + notes. Two sections: "Parish notes" (public,
  with email-prefix attribution) and "My private note".
- Full create/edit/delete via src/lib/noteActions.ts + useDayNotes.ts.
  MULTIPLE notes per day allowed for BOTH private and public.
- Permission matrix (enforced server-side, 10 TenantDB tests + route gate;
  UI mirrors it): private = author-only read+write; public = all staff read,
  admins only write; any admin can edit/delete any public note; attribution
  = email prefix of last editor (or author). Soft delete (deleted_at).

### App shell / auth (DONE, deployed)
- Login gate: /api/me on load -> loading | Google sign-in screen | app.
- Personalized topbar: "<email-prefix> · <parish name>" + role badge +
  Sign out (logout now redirects to /).
- /api/me returns email + parishName (via TenantDB.displayInfo).

### Canonical domain
- Production URL is https://myordo.cenaclelabs.com (custom domain on the
  Worker). APP_BASE_URL points here. The .workers.dev URL still resolves but
  humans use the cenaclelabs.com domain. Google OAuth redirect URIs cover
  the cenaclelabs.com callback + localhost.

### Beta parish data
- Parish id 'beta-parish' (internal PK, unchanged) is now named
  "Don Bosco Sta Rosa", slug 'don-bosco-sta-rosa', on BOTH local and remote.
- 7 seeded memberships (see earlier Phase B entry). Remaining before the
  other members can log in: add their emails as Google OAuth "test users"
  in the Google Cloud console (app is in Testing mode).

### romcal upstream contribution — STILL NOT FILED
- The CBCP corrections issue draft (docs-romcal-contribution-draft.md) is
  still ready but not yet filed at github.com/romcal/romcal/issues/new.

### State of the beta
myORDO is FUNCTIONALLY COMPLETE for beta: on the live domain, a parish admin
can log in, see an accurate Philippine liturgical calendar (with the Filipino
saints correct via the corrections layer), and post parish-wide notes + keep
private journals, all correctly permissioned. Not yet done: PWA offline shell
(Phase E), full CBCP ordo diff (§13), compliance paperwork (deferred per beta
scope), and general polish.
