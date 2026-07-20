-- Track who last edited a note, distinct from who created it.
-- Apply with: npm run db:migrate:local (or db:migrate:remote)
--
-- WHY: parish-public notes can be edited by ANY admin, not just the
-- creator (per the notes permission matrix). The UI cites "who last
-- touched this" using the email prefix. author_user_id (created-by) and
-- last_edited_by_user_id (last-editor) are therefore distinct facts.
-- NULL last_edited_by_user_id means never edited -> fall back to author.

ALTER TABLE liturgical_notes ADD COLUMN last_edited_by_user_id TEXT REFERENCES users(id);
