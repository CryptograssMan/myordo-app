-- Offline sync (offline-pwa spec §3.2).
-- Apply with: npm run db:migrate:local (or db:migrate:remote)
--
-- Two tables:
--  1. sync_mutations — idempotency ledger for POST /api/sync/push. A
--     replayed mutation_id returns the recorded outcome instead of
--     applying the write twice (client retries are therefore always safe).
--  2. note_changes — monotonic, parish-scoped change feed. `seq` is the
--     pull cursor — never updated_at — so clock skew and same-second
--     ties can never make a client miss a change. Every write to
--     liturgical_notes appends one row here IN THE SAME BATCH (enforced
--     in TenantDB, the sole write path).

CREATE TABLE sync_mutations (
  mutation_id TEXT PRIMARY KEY,
  parish_id   TEXT NOT NULL REFERENCES parishes(id),
  user_id     TEXT NOT NULL REFERENCES users(id),
  note_id     TEXT NOT NULL,
  result      TEXT NOT NULL CHECK (result IN ('applied','conflict','rejected')),
  new_version INTEGER,
  reason      TEXT,               -- populated for 'rejected'
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_syncmut_tenant ON sync_mutations(parish_id, created_at);

CREATE TABLE note_changes (
  seq        INTEGER PRIMARY KEY AUTOINCREMENT,
  parish_id  TEXT NOT NULL REFERENCES parishes(id),
  note_id    TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_changes_tenant ON note_changes(parish_id, seq);
