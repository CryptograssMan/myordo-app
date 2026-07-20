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
