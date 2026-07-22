-- Super-admin audit log. §3.4 (privileged cross-parish path), §8 (sacred
-- infra), §12 (DPA audit trail). Append-only: never UPDATEd or DELETEd.
CREATE TABLE super_admin_audit (
  id            TEXT PRIMARY KEY,
  actor_user_id TEXT NOT NULL REFERENCES users(id),
  actor_email   TEXT NOT NULL,
  action        TEXT NOT NULL,
  target_type   TEXT NOT NULL,
  target_id     TEXT NOT NULL,
  before_json   TEXT,
  after_json    TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_saa_actor   ON super_admin_audit(actor_user_id);
CREATE INDEX idx_saa_target  ON super_admin_audit(target_type, target_id);
CREATE INDEX idx_saa_created ON super_admin_audit(created_at);
