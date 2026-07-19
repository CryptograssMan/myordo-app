-- Sessions for Google SSO
-- Apply with: npm run db:migrate:local (or db:migrate:remote)
--
-- NOTE: users.google_sub already exists (defined in 0001_init.sql), so
-- this migration only adds the sessions table. google_sub is bound on
-- first login for a user whose parish_memberships row was seeded at
-- provisioning/invite time (architecture §5) -- login BINDS an identity
-- to a pre-seeded membership, it does not create unsolicited accounts.

-- ---------------------------------------------------------------------
-- Sessions (opaque bearer token in an httpOnly cookie -> this table)
-- ---------------------------------------------------------------------
CREATE TABLE sessions (
  id         TEXT PRIMARY KEY,   -- random token, also the cookie value
  user_id    TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL
);
CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);
