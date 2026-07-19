-- myORDO — D1 schema
-- Apply with: npm run db:migrate:local (or db:migrate:remote)

PRAGMA foreign_keys = ON;

-- ---------------------------------------------------------------------
-- Global identity (one row per human, from Google)
-- ---------------------------------------------------------------------
CREATE TABLE users (
  id                 TEXT PRIMARY KEY,          -- uuid
  google_sub         TEXT UNIQUE,               -- Google subject id, bound on first login
  email              TEXT NOT NULL,
  display_name       TEXT,
  preferred_language TEXT CHECK (preferred_language IN ('en','tl')),  -- null = use parish default
  created_at         TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ---------------------------------------------------------------------
-- Tenants
-- ---------------------------------------------------------------------
CREATE TABLE parishes (
  id                  TEXT PRIMARY KEY,          -- uuid
  name                TEXT NOT NULL,
  slug                TEXT UNIQUE,               -- optional vanity identifier
  default_language    TEXT NOT NULL DEFAULT 'en' CHECK (default_language IN ('en','tl')),
  banner_r2_key       TEXT,
  subscription_status TEXT NOT NULL DEFAULT 'active' CHECK (subscription_status IN ('active','past_due','canceled')),
  created_at          TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ---------------------------------------------------------------------
-- SECURITY-CRITICAL join: who may act inside which parish, and how.
-- This table is the security boundary. parish_id is never trusted from
-- request input — it is only ever resolved via this table (see TenantDB).
-- ---------------------------------------------------------------------
CREATE TABLE parish_memberships (
  id         TEXT PRIMARY KEY,          -- uuid
  parish_id  TEXT NOT NULL REFERENCES parishes(id),
  user_id    TEXT REFERENCES users(id), -- null until the invited email logs in
  email      TEXT NOT NULL,             -- seeded at provisioning/invite time
  role       TEXT NOT NULL CHECK (role IN ('admin','staff')),
  status     TEXT NOT NULL DEFAULT 'invited' CHECK (status IN ('invited','active','revoked')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (parish_id, email)
);

CREATE INDEX idx_memberships_user ON parish_memberships(user_id);
CREATE INDEX idx_memberships_parish ON parish_memberships(parish_id, status);

-- ---------------------------------------------------------------------
-- Tenant data: every row is parish-scoped. Never queried without
-- parish_id — see TenantDB, the sole path to this table.
-- ---------------------------------------------------------------------
CREATE TABLE liturgical_notes (
  id              TEXT PRIMARY KEY,          -- uuid
  parish_id       TEXT NOT NULL REFERENCES parishes(id),
  author_user_id  TEXT NOT NULL REFERENCES users(id),
  visibility      TEXT NOT NULL CHECK (visibility IN ('private','parish_public')),
  liturgical_date TEXT NOT NULL,             -- ISO date (YYYY-MM-DD)
  title           TEXT,
  body            TEXT,
  version         INTEGER NOT NULL DEFAULT 1,
  updated_at      TEXT NOT NULL DEFAULT (datetime('now')),  -- SERVER-assigned, never client clock
  deleted_at      TEXT
);

CREATE INDEX idx_notes_tenant ON liturgical_notes(parish_id, liturgical_date);

-- ---------------------------------------------------------------------
-- Append-only history so no edit is ever lost (offline conflict resolution)
-- ---------------------------------------------------------------------
CREATE TABLE note_revisions (
  id             TEXT PRIMARY KEY,          -- uuid
  note_id        TEXT NOT NULL REFERENCES liturgical_notes(id),
  parish_id      TEXT NOT NULL REFERENCES parishes(id),
  author_user_id TEXT NOT NULL,
  body           TEXT,
  created_at     TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_revisions_note ON note_revisions(note_id);

-- ---------------------------------------------------------------------
-- Idempotency + observability for the provisioning pipeline
-- ---------------------------------------------------------------------
CREATE TABLE provisioning_events (
  paymongo_event_id TEXT PRIMARY KEY,        -- dedupe key from PayMongo webhook
  parish_id         TEXT,
  status            TEXT NOT NULL DEFAULT 'received' CHECK (status IN ('received','done','failed')),
  attempts          INTEGER NOT NULL DEFAULT 0,
  last_error        TEXT,
  created_at        TEXT NOT NULL DEFAULT (datetime('now'))
);
