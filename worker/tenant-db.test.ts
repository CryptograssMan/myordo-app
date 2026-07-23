// worker/tenant-db.test.ts
//
// Two security boundaries proven here:
//  1. Cross-tenant isolation (§3.1): a parish never sees another's notes.
//  2. Notes permission matrix: staff cannot create/edit/delete
//     parish-public notes; private notes are author-only; any admin can
//     edit/delete any public note; attribution resolves to the email
//     prefix of the last editor (or author if unedited).

import { env } from "cloudflare:workers";
import { beforeEach, describe, expect, it } from "vitest";
import { TenantDB, NotePermissionError, type NoteRow } from "./tenant-db.js";

async function applySchema() {
  for (const table of [
    "sync_mutations",
    "note_changes",
    "note_revisions",
    "liturgical_notes",
    "parish_memberships",
    "users",
    "parishes",
  ]) {
    await env.DB.prepare(`DROP TABLE IF EXISTS ${table}`).run();
  }

  await env.DB.prepare(`
    CREATE TABLE parishes (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, slug TEXT UNIQUE,
      default_language TEXT NOT NULL DEFAULT 'en',
      subscription_status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `).run();
  await env.DB.prepare(`
    CREATE TABLE users (
      id TEXT PRIMARY KEY, google_sub TEXT UNIQUE, email TEXT NOT NULL,
      display_name TEXT, preferred_language TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `).run();
  await env.DB.prepare(`
    CREATE TABLE parish_memberships (
      id TEXT PRIMARY KEY, parish_id TEXT NOT NULL, user_id TEXT,
      email TEXT NOT NULL, role TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'invited',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE (parish_id, email)
    )
  `).run();
  await env.DB.prepare(`
    CREATE TABLE liturgical_notes (
      id TEXT PRIMARY KEY, parish_id TEXT NOT NULL,
      author_user_id TEXT NOT NULL, last_edited_by_user_id TEXT,
      visibility TEXT NOT NULL, liturgical_date TEXT NOT NULL,
      title TEXT, body TEXT, version INTEGER NOT NULL DEFAULT 1,
      updated_at TEXT NOT NULL DEFAULT (datetime('now')), deleted_at TEXT
    )
  `).run();
  await env.DB.prepare(`
    CREATE TABLE note_revisions (
      id TEXT PRIMARY KEY, note_id TEXT NOT NULL, parish_id TEXT NOT NULL,
      author_user_id TEXT NOT NULL, body TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `).run();
  await env.DB.prepare(`
    CREATE TABLE note_changes (
      seq INTEGER PRIMARY KEY AUTOINCREMENT,
      parish_id TEXT NOT NULL, note_id TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `).run();
  await env.DB.prepare(`
    CREATE TABLE sync_mutations (
      mutation_id TEXT PRIMARY KEY, parish_id TEXT NOT NULL,
      user_id TEXT NOT NULL, note_id TEXT NOT NULL,
      result TEXT NOT NULL, new_version INTEGER, reason TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `).run();
}

async function seed() {
  await env.DB.prepare(
    `INSERT INTO parishes (id, name, slug) VALUES
       ('parish-1', 'St. Jude', 'st-jude'),
       ('parish-2', 'St. Peter', 'st-peter')`,
  ).run();
  await env.DB.prepare(
    `INSERT INTO users (id, email, display_name) VALUES
       ('admin-1', 'redmaroon1989@gmail.com', 'Admin One'),
       ('admin-2', 'cristobalyang70@gmail.com', 'Admin Two'),
       ('staff-1', 'gjoel2455@gmail.com', 'Staff One'),
       ('p2-admin', 'admin@stpeter.test', 'P2 Admin')`,
  ).run();
  await env.DB.prepare(
    `INSERT INTO parish_memberships (id, parish_id, user_id, email, role, status) VALUES
       ('m-a1', 'parish-1', 'admin-1', 'redmaroon1989@gmail.com', 'admin', 'active'),
       ('m-a2', 'parish-1', 'admin-2', 'cristobalyang70@gmail.com', 'admin', 'active'),
       ('m-s1', 'parish-1', 'staff-1', 'gjoel2455@gmail.com', 'staff', 'active'),
       ('m-p2', 'parish-2', 'p2-admin', 'admin@stpeter.test', 'admin', 'active')`,
  ).run();
}

const DATE = "2026-07-19";

describe("TenantDB — tenant isolation", () => {
  beforeEach(async () => {
    await applySchema();
    await seed();
  });

  it("a parish never sees another parish's notes", async () => {
    const p1 = new TenantDB(env.DB, "parish-1");
    const p2 = new TenantDB(env.DB, "parish-2");
    await p1.createNote({
      id: "n1", userId: "admin-1", role: "admin",
      visibility: "parish_public", liturgicalDate: DATE,
      title: "P1 public", body: "parish-1 content",
    });
    await p2.createNote({
      id: "n2", userId: "p2-admin", role: "admin",
      visibility: "parish_public", liturgicalDate: DATE,
      title: "P2 public", body: "parish-2 content",
    });
    const p1Notes = await p1.listNotesForDate(DATE, "admin-1");
    const p2Notes = await p2.listNotesForDate(DATE, "p2-admin");
    expect(p1Notes.map((n: NoteRow) => n.id)).toEqual(["n1"]);
    expect(p2Notes.map((n: NoteRow) => n.id)).toEqual(["n2"]);
  });

  it("TenantDB refuses construction without a parishId", () => {
    expect(() => new TenantDB(env.DB, "")).toThrow(
      "TenantDB requires a non-empty parishId",
    );
  });
});

describe("TenantDB — notes permission matrix", () => {
  beforeEach(async () => {
    await applySchema();
    await seed();
  });

  it("staff CANNOT create a parish-public note", async () => {
    const db = new TenantDB(env.DB, "parish-1");
    await expect(
      db.createNote({
        id: "x", userId: "staff-1", role: "staff",
        visibility: "parish_public", liturgicalDate: DATE,
        title: "nope", body: "should be blocked",
      }),
    ).rejects.toBeInstanceOf(NotePermissionError);
  });

  it("staff CAN create a private note (own journal)", async () => {
    const db = new TenantDB(env.DB, "parish-1");
    await db.createNote({
      id: "priv1", userId: "staff-1", role: "staff",
      visibility: "private", liturgicalDate: DATE,
      title: "my journal", body: "personal",
    });
    const notes = await db.listNotesForDate(DATE, "staff-1");
    expect(notes.map((n: NoteRow) => n.id)).toContain("priv1");
  });

  it("a staff member's private note is invisible to others", async () => {
    const db = new TenantDB(env.DB, "parish-1");
    await db.createNote({
      id: "priv2", userId: "staff-1", role: "staff",
      visibility: "private", liturgicalDate: DATE,
      title: "secret", body: "mine only",
    });
    // admin-1 fetching the same date must NOT see staff-1's private note
    const adminView = await db.listNotesForDate(DATE, "admin-1");
    expect(adminView.map((n: NoteRow) => n.id)).not.toContain("priv2");
  });

  it("admin CAN create a parish-public note, with attribution", async () => {
    const db = new TenantDB(env.DB, "parish-1");
    await db.createNote({
      id: "pub1", userId: "admin-1", role: "admin",
      visibility: "parish_public", liturgicalDate: DATE,
      title: "Mass schedule", body: "9am and 11am",
    });
    const notes = await db.listNotesForDate(DATE, "staff-1"); // staff can READ
    const pub = notes.find((n: NoteRow) => n.id === "pub1");
    expect(pub).toBeDefined();
    expect(pub!.attribution).toBe("redmaroon1989"); // email prefix of author
  });

  it("a DIFFERENT admin can edit a public note; attribution updates", async () => {
    const db = new TenantDB(env.DB, "parish-1");
    await db.createNote({
      id: "pub2", userId: "admin-1", role: "admin",
      visibility: "parish_public", liturgicalDate: DATE,
      title: "Draft", body: "v1",
    });
    // admin-2 (not the creator) edits it
    await db.updateNote({
      noteId: "pub2", userId: "admin-2", role: "admin",
      title: "Draft", body: "v2 edited by admin-2",
    });
    const notes = await db.listNotesForDate(DATE, "staff-1");
    const pub = notes.find((n: NoteRow) => n.id === "pub2");
    expect(pub!.body).toBe("v2 edited by admin-2");
    expect(pub!.attribution).toBe("cristobalyang70"); // now the last editor
  });

  it("staff CANNOT edit or delete a parish-public note", async () => {
    const db = new TenantDB(env.DB, "parish-1");
    await db.createNote({
      id: "pub3", userId: "admin-1", role: "admin",
      visibility: "parish_public", liturgicalDate: DATE,
      title: "official", body: "admin content",
    });
    await expect(
      db.updateNote({ noteId: "pub3", userId: "staff-1", role: "staff", title: "x", body: "y" }),
    ).rejects.toBeInstanceOf(NotePermissionError);
    await expect(
      db.deleteNote({ noteId: "pub3", userId: "staff-1", role: "staff" }),
    ).rejects.toBeInstanceOf(NotePermissionError);
  });

  it("a user cannot edit another user's private note", async () => {
    const db = new TenantDB(env.DB, "parish-1");
    await db.createNote({
      id: "priv3", userId: "staff-1", role: "staff",
      visibility: "private", liturgicalDate: DATE,
      title: "staff journal", body: "mine",
    });
    // admin-1 tries to edit staff-1's private note — even as admin, no.
    await expect(
      db.updateNote({ noteId: "priv3", userId: "admin-1", role: "admin", title: "x", body: "y" }),
    ).rejects.toBeInstanceOf(NotePermissionError);
  });

  it("soft-delete hides a note but the row is retained", async () => {
    const db = new TenantDB(env.DB, "parish-1");
    await db.createNote({
      id: "pub4", userId: "admin-1", role: "admin",
      visibility: "parish_public", liturgicalDate: DATE,
      title: "temp", body: "delete me",
    });
    await db.deleteNote({ noteId: "pub4", userId: "admin-2", role: "admin" });
    const notes = await db.listNotesForDate(DATE, "staff-1");
    expect(notes.map((n: NoteRow) => n.id)).not.toContain("pub4"); // hidden
    // row still exists (soft delete)
    const row = await env.DB.prepare(
      `SELECT deleted_at FROM liturgical_notes WHERE id = 'pub4'`,
    ).first<{ deleted_at: string | null }>();
    expect(row?.deleted_at).not.toBeNull();
  });
});

// ---------------------------------------------------------------------
// Offline sync protocol (offline-pwa spec §3): idempotent replay,
// private latest-wins with revision preservation, parish-public
// conflict surfacing, tombstone replication, cross-parish rejection,
// and the seq-cursor pull.
// ---------------------------------------------------------------------

describe("TenantDB — offline sync", () => {
  beforeEach(async () => {
    await applySchema();
    await seed();
  });

  function db(parish = "parish-1") {
    return new TenantDB(env.DB, parish);
  }

  it("create via mutation applies once and replays idempotently", async () => {
    const p1 = db();
    const mutation = {
      mutationId: "mut-1",
      type: "create" as const,
      noteId: "note-1",
      baseVersion: 0,
      payload: {
        visibility: "private" as const,
        liturgicalDate: DATE,
        title: "Homily",
        body: "draft one",
      },
    };
    const first = await p1.applyMutation({ mutation, userId: "staff-1", role: "staff" });
    expect(first.status).toBe("applied");
    if (first.status === "applied") expect(first.newVersion).toBe(1);

    // Replay (client retried after a dropped response) — no double write.
    const replay = await p1.applyMutation({ mutation, userId: "staff-1", role: "staff" });
    expect(replay.status).toBe("applied");
    const notes = await p1.listNotesForDate(DATE, "staff-1");
    expect(notes).toHaveLength(1);
    expect(notes[0].version).toBe(1);
  });

  it("stale write to a PRIVATE note wins, preserving the superseded body", async () => {
    const p1 = db();
    await p1.applyMutation({
      mutation: {
        mutationId: "m-create",
        type: "create",
        noteId: "n-priv",
        baseVersion: 0,
        payload: { visibility: "private", liturgicalDate: DATE, title: null, body: "phone edit" },
      },
      userId: "staff-1",
      role: "staff",
    });
    // Same author edits from a second device without the phone's push.
    await p1.applyMutation({
      mutation: {
        mutationId: "m-laptop",
        type: "update",
        noteId: "n-priv",
        baseVersion: 1,
        payload: { title: null, body: "laptop edit" },
      },
      userId: "staff-1",
      role: "staff",
    });
    // Phone pushes a STALE edit (baseVersion 1, server is at 2).
    const stale = await p1.applyMutation({
      mutation: {
        mutationId: "m-phone",
        type: "update",
        noteId: "n-priv",
        baseVersion: 1,
        payload: { title: null, body: "phone edit v2" },
      },
      userId: "staff-1",
      role: "staff",
    });
    expect(stale.status).toBe("applied"); // latest-received wins for private
    const notes = await p1.listNotesForDate(DATE, "staff-1");
    expect(notes[0].body).toBe("phone edit v2");
    expect(notes[0].version).toBe(3);
    // The overwritten laptop body is recoverable in note_revisions.
    const revs = await env.DB.prepare(
      `SELECT body FROM note_revisions WHERE note_id = 'n-priv' ORDER BY rowid`,
    ).all<{ body: string | null }>();
    expect(revs.results.map((r) => r.body)).toContain("laptop edit");
  });

  it("stale write to a PARISH-PUBLIC note conflicts, both bodies preserved", async () => {
    const p1 = db();
    await p1.applyMutation({
      mutation: {
        mutationId: "m-c",
        type: "create",
        noteId: "n-pub",
        baseVersion: 0,
        payload: { visibility: "parish_public", liturgicalDate: DATE, title: "Sked", body: "v1" },
      },
      userId: "admin-1",
      role: "admin",
    });
    await p1.applyMutation({
      mutation: { mutationId: "m-a2", type: "update", noteId: "n-pub", baseVersion: 1,
        payload: { title: "Sked", body: "admin-2 edit" } },
      userId: "admin-2",
      role: "admin",
    });
    const conflict = await p1.applyMutation({
      mutation: { mutationId: "m-a1-stale", type: "update", noteId: "n-pub", baseVersion: 1,
        payload: { title: "Sked", body: "admin-1 offline edit" } },
      userId: "admin-1",
      role: "admin",
    });
    expect(conflict.status).toBe("conflict");
    if (conflict.status === "conflict") {
      expect(conflict.serverBody).toBe("admin-2 edit"); // NOT overwritten
      expect(conflict.serverVersion).toBe(2);
    }
    // The rejected incoming body is preserved as a revision.
    const revs = await env.DB.prepare(
      `SELECT body FROM note_revisions WHERE note_id = 'n-pub'`,
    ).all<{ body: string | null }>();
    expect(revs.results.map((r) => r.body)).toContain("admin-1 offline edit");
  });

  it("staff mutation on a parish-public note is rejected", async () => {
    const p1 = db();
    const r = await p1.applyMutation({
      mutation: {
        mutationId: "m-staff-pub",
        type: "create",
        noteId: "n-x",
        baseVersion: 0,
        payload: { visibility: "parish_public", liturgicalDate: DATE, title: null, body: "nope" },
      },
      userId: "staff-1",
      role: "staff",
    });
    expect(r.status).toBe("rejected");
    if (r.status === "rejected") expect(r.reason).toBe("public_notes_admin_only");
  });

  it("bootstrap returns live notes only; incremental carries tombstones", async () => {
    const p1 = db();
    await p1.createNote({
      id: "pub-1", userId: "admin-1", role: "admin",
      visibility: "parish_public", liturgicalDate: DATE, title: "Public", body: "b",
    });
    await p1.createNote({
      id: "priv-staff", userId: "staff-1", role: "staff",
      visibility: "private", liturgicalDate: DATE, title: "Staff private", body: "s",
    });

    // Bootstrap (since=0): live notes, visibility-filtered. A fresh
    // device has no local data, so deletions are irrelevant to it.
    const boot = await p1.pullChanges({ sinceSeq: 0, limit: 200, userId: "admin-1" });
    expect(boot.changes.map((c) => c.id)).toContain("pub-1");
    expect(boot.changes.map((c) => c.id)).not.toContain("priv-staff");
    expect(boot.changes.every((c) => c.deleted_at === null)).toBe(true);

    // staff-1 bootstraps and DOES see their own private note.
    const staffBoot = await p1.pullChanges({ sinceSeq: 0, limit: 200, userId: "staff-1" });
    expect(staffBoot.changes.map((c) => c.id)).toContain("priv-staff");

    // Incremental from that cursor MUST carry the tombstone, so a device
    // that already holds the note deletes it locally.
    await p1.deleteNote({ noteId: "pub-1", userId: "admin-1", role: "admin" });
    const incr = await p1.pullChanges({
      sinceSeq: boot.nextSince, limit: 200, userId: "admin-1",
    });
    const tomb = incr.changes.find((c) => c.id === "pub-1");
    expect(tomb).toBeDefined();
    expect(tomb?.deleted_at).not.toBeNull();

    // Nothing new after that.
    const again = await p1.pullChanges({
      sinceSeq: incr.nextSince, limit: 200, userId: "admin-1",
    });
    expect(again.changes).toHaveLength(0);
    expect(again.hasMore).toBe(false);
  });

  it("bootstrap pull returns notes that predate the change feed", async () => {
    // Regression: notes written before note_changes existed have no feed
    // row. Bootstrap must read the notes table, not the journal.
    await env.DB.prepare(
      `INSERT INTO liturgical_notes
         (id, parish_id, author_user_id, visibility, liturgical_date, title, body)
       VALUES ('legacy-note','parish-1','admin-1','parish_public','2026-08-02','Legacy','pre-existing')`,
    ).run();
    const feed = await env.DB.prepare(
      `SELECT COUNT(*) AS n FROM note_changes WHERE note_id = 'legacy-note'`,
    ).first<{ n: number }>();
    expect(feed?.n).toBe(0); // no feed row, exactly like production

    const page = await db().pullChanges({ sinceSeq: 0, limit: 200, userId: "admin-1" });
    expect(page.changes.map((c) => c.id)).toContain("legacy-note");
  });

  it("cross-parish: a mutation against another parish's note is invisible", async () => {
    const p1 = db();
    const p2 = db("parish-2");
    await p1.createNote({
      id: "p1-note", userId: "admin-1", role: "admin",
      visibility: "parish_public", liturgicalDate: DATE, title: "P1", body: "secret",
    });
    // parish-2's TenantDB cannot see, edit, or pull it.
    const r = await p2.applyMutation({
      mutation: { mutationId: "m-cross", type: "update", noteId: "p1-note", baseVersion: 1,
        payload: { title: "stolen", body: "stolen" } },
      userId: "p2-admin",
      role: "admin",
    });
    expect(r.status).toBe("rejected");
    if (r.status === "rejected") expect(r.reason).toBe("not_found");
    const p2Pull = await p2.pullChanges({ sinceSeq: 0, limit: 200, userId: "p2-admin" });
    expect(p2Pull.changes.map((c) => c.id)).not.toContain("p1-note");
  });

  it("deleting an edited public note (stale) surfaces a conflict instead", async () => {
    const p1 = db();
    await p1.createNote({
      id: "n-del", userId: "admin-1", role: "admin",
      visibility: "parish_public", liturgicalDate: DATE, title: "T", body: "v1",
    });
    await p1.updateNote({
      noteId: "n-del", userId: "admin-2", role: "admin", title: "T", body: "v2",
    });
    const r = await p1.applyMutation({
      mutation: { mutationId: "m-del-stale", type: "delete", noteId: "n-del",
        baseVersion: 1, payload: null },
      userId: "admin-1",
      role: "admin",
    });
    expect(r.status).toBe("conflict"); // admin-2's edit is not destroyed
    const notes = await p1.listNotesForDate(DATE, "admin-1");
    expect(notes.find((n) => n.id === "n-del")?.body).toBe("v2");
  });
});
