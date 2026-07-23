-- Backfill the change feed for notes that predate 0005.
--
-- note_changes was introduced empty, but pull joins FROM it — so every
-- note created before the offline-sync deploy had no feed row and was
-- invisible to /api/sync/pull (and therefore to the whole client, which
-- now renders from IndexedDB). This gives each existing note one seq.
--
-- Idempotent: re-running inserts nothing.

INSERT INTO note_changes (parish_id, note_id, created_at)
SELECT n.parish_id, n.id, datetime('now')
FROM liturgical_notes n
WHERE NOT EXISTS (
  SELECT 1 FROM note_changes c WHERE c.note_id = n.id AND c.parish_id = n.parish_id
);
