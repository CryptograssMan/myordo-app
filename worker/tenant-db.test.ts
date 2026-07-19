// worker/tenant-db.test.ts
//
// Codifies the confidentiality guarantee from architecture §3.1:
// a parish must never be able to see another parish's notes. This
// was first verified manually via curl against seeded local D1 data;
// this test makes that check permanent and CI-runnable.

import { env } from "cloudflare:workers";
import { beforeEach, describe, expect, it } from "vitest";
import { TenantDB } from "./tenant-db";

async function applySchema() {
  // Mirrors migrations/0001_init.sql. Kept inline (rather than reading
  // the file) so this test has no filesystem dependency inside the
  // Workers test runtime.
  //
  // NOTE: uses .prepare(sql).run() rather than .exec(), because
  // D1Database.exec() splits its input by newline and expects one
  // statement per line -- it cannot handle multi-line formatted SQL.
  //
  // NOTE: D1 storage in @cloudflare/vitest-pool-workers persists across
  // tests within the same file (isolation is per-file, not per-test), so
  // we DROP each table first to guarantee a clean slate every test --
  // otherwise the second test's INSERTs collide with the first test's rows.
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
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT UNIQUE,
      default_language TEXT NOT NULL DEFAULT 'en',
      banner_r2_key TEXT,
      subscription_status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `).run();

  await env.DB.prepare(`
    CREATE TABLE users (
      id TEXT PRIMARY KEY,
      google_sub TEXT UNIQUE,
      email TEXT NOT NULL,
      display_name TEXT,
      preferred_language TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `).run();

  await env.DB.prepare(`
    CREATE TABLE parish_memberships (
      id TEXT PRIMARY KEY,
      parish_id TEXT NOT NULL REFERENCES parishes(id),
      user_id TEXT REFERENCES users(id),
      email TEXT NOT NULL,
      role TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'invited',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE (parish_id, email)
    )
  `).run();

  await env.DB.prepare(`
    CREATE TABLE liturgical_notes (
      id TEXT PRIMARY KEY,
      parish_id TEXT NOT NULL REFERENCES parishes(id),
      author_user_id TEXT NOT NULL REFERENCES users(id),
      visibility TEXT NOT NULL,
      liturgical_date TEXT NOT NULL,
      title TEXT,
      body TEXT,
      version INTEGER NOT NULL DEFAULT 1,
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      deleted_at TEXT
    )
  `).run();
}

async function seedTwoParishes() {
  await env.DB.prepare(
    `INSERT INTO parishes (id, name, slug, default_language, subscription_status)
     VALUES ('parish-1', 'St. Jude Test Parish', 'st-jude', 'en', 'active'),
            ('parish-2', 'St. Peter Test Parish', 'st-peter', 'en', 'active')`,
  ).run();

  await env.DB.prepare(
    `INSERT INTO users (id, google_sub, email, display_name)
     VALUES ('user-1', 'sub-1', 'admin@stjude.test', 'Test Admin 1'),
            ('user-2', 'sub-2', 'admin@stpeter.test', 'Test Admin 2')`,
  ).run();

  await env.DB.prepare(
    `INSERT INTO parish_memberships (id, parish_id, user_id, email, role, status)
     VALUES ('mem-1', 'parish-1', 'user-1', 'admin@stjude.test', 'admin', 'active'),
            ('mem-2', 'parish-2', 'user-2', 'admin@stpeter.test', 'admin', 'active')`,
  ).run();

  const parish1Db = new TenantDB(env.DB, "parish-1");
  const parish2Db = new TenantDB(env.DB, "parish-2");

  await parish1Db.createNote({
    id: "note-1",
    authorUserId: "user-1",
    visibility: "parish_public",
    liturgicalDate: "2026-07-19",
    title: "St. Jude homily draft",
    body: "This is parish-1 confidential content",
  });

  await parish2Db.createNote({
    id: "note-2",
    authorUserId: "user-2",
    visibility: "parish_public",
    liturgicalDate: "2026-07-19",
    title: "St. Peter homily draft",
    body: "This is parish-2 confidential content",
  });
}

describe("TenantDB cross-tenant isolation", () => {
  beforeEach(async () => {
    await applySchema();
    await seedTwoParishes();
  });

  it("a parish only ever sees its own notes, never another parish's", async () => {
    const parish1Db = new TenantDB(env.DB, "parish-1");
    const parish2Db = new TenantDB(env.DB, "parish-2");

    const parish1Notes = await parish1Db.listNotesForDate("2026-07-19", "user-1");
    const parish2Notes = await parish2Db.listNotesForDate("2026-07-19", "user-2");

    expect(parish1Notes).toHaveLength(1);
    expect(parish1Notes[0].id).toBe("note-1");
    expect(parish1Notes[0].title).toBe("St. Jude homily draft");

    expect(parish2Notes).toHaveLength(1);
    expect(parish2Notes[0].id).toBe("note-2");
    expect(parish2Notes[0].title).toBe("St. Peter homily draft");

    // The actual security assertion: neither parish's result set
    // contains the other parish's note id, under any circumstance.
    const parish1NoteIds = parish1Notes.map((n: any) => n.id);
    const parish2NoteIds = parish2Notes.map((n: any) => n.id);
    expect(parish1NoteIds).not.toContain("note-2");
    expect(parish2NoteIds).not.toContain("note-1");
  });

  it("TenantDB refuses to be constructed without a parishId", () => {
    expect(() => new TenantDB(env.DB, "")).toThrow(
      "TenantDB requires a non-empty parishId",
    );
  });

  it("findMembershipsForUser only returns active memberships for that user", async () => {
    const { results } = await TenantDB.findMembershipsForUser(env.DB, "user-1");
    expect(results).toHaveLength(1);
    expect((results[0] as any).parish_id).toBe("parish-1");
  });
});
