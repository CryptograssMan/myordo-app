// src/lib/localdb.ts
//
// The on-device data layer (offline-pwa spec §2). One IndexedDB database
// `myordo` with four stores. RULES:
//  - Every record carries parishId, so revocation wipe (§1.5) is a single
//    index range delete — mirroring the server's row-scoping discipline.
//  - The UI reads ONLY from here; the network is touched only by
//    syncEngine.ts. Online and offline rendering are the same code path.

import { openDB, type DBSchema, type IDBPDatabase } from "idb";

// --- Records -----------------------------------------------------------

export interface LocalNote {
  id: string;
  parishId: string;
  visibility: "private" | "parish_public";
  liturgical_date: string;
  title: string | null;
  body: string | null;
  version: number; // server version this row reflects (0 = never synced)
  updated_at: string; // server-assigned; display only
  author_user_id: string;
  attribution: string | null;
  /** True while an outbox mutation for this note is pending. */
  dirty?: boolean;
}

export interface OutboxMutation {
  mutationId: string;
  parishId: string;
  userId: string;
  type: "create" | "update" | "delete";
  noteId: string;
  baseVersion: number;
  payload: {
    title?: string | null;
    body?: string | null;
    visibility?: "private" | "parish_public";
    liturgicalDate?: string;
  } | null;
  createdAt: string; // client time — ordering within the outbox only
  attempts: number;
  lastError?: string;
}

export interface ConflictEntry {
  noteId: string;
  parishId: string;
  kind: "conflict" | "rejected";
  reason?: string;
  /** What this device tried to write. */
  mineTitle: string | null;
  mineBody: string | null;
  /** What the server holds (conflict only). */
  serverVersion?: number;
  serverTitle?: string | null;
  serverBody?: string | null;
  createdAt: string;
}

export interface CachedMembership {
  parishId: string;
  parishName: string;
  role: "admin" | "staff";
  defaultLanguage: "en" | "tl";
  subscriptionStatus: "active" | "past_due" | "canceled";
}

export interface IdentitySnapshot {
  userId: string;
  email: string;
  displayName: string | null;
  preferredLanguage: "en" | "tl" | null;
  isSuperAdmin: boolean;
  memberships: CachedMembership[];
  activeParishId: string;
  activeRole: "admin" | "staff";
  activeParishName: string;
  sessionExpiresAt: string | null;
  snapshotFetchedAt: string;
}

interface MyOrdoDB extends DBSchema {
  meta: {
    key: string;
    value: unknown;
  };
  notes: {
    key: string;
    value: LocalNote;
    indexes: {
      byParishDate: [string, string];
      byParish: string;
    };
  };
  outbox: {
    key: string;
    value: OutboxMutation;
    indexes: { byParish: string };
  };
  conflicts: {
    key: string;
    value: ConflictEntry;
    indexes: { byParish: string };
  };
}

let dbPromise: Promise<IDBPDatabase<MyOrdoDB>> | null = null;

export function localdb(): Promise<IDBPDatabase<MyOrdoDB>> {
  dbPromise ??= openDB<MyOrdoDB>("myordo", 1, {
    upgrade(db) {
      db.createObjectStore("meta");
      const notes = db.createObjectStore("notes", { keyPath: "id" });
      notes.createIndex("byParishDate", ["parishId", "liturgical_date"]);
      notes.createIndex("byParish", "parishId");
      const outbox = db.createObjectStore("outbox", { keyPath: "mutationId" });
      outbox.createIndex("byParish", "parishId");
      const conflicts = db.createObjectStore("conflicts", { keyPath: "noteId" });
      conflicts.createIndex("byParish", "parishId");
    },
  });
  return dbPromise;
}

// --- Meta (snapshot, cursors, banner state) ---------------------------

export async function getSnapshot(): Promise<IdentitySnapshot | null> {
  const db = await localdb();
  return ((await db.get("meta", "identitySnapshot")) as IdentitySnapshot) ?? null;
}

export async function putSnapshot(s: IdentitySnapshot): Promise<void> {
  const db = await localdb();
  await db.put("meta", s, "identitySnapshot");
}

export async function getSyncCursor(parishId: string): Promise<number> {
  const db = await localdb();
  return ((await db.get("meta", `syncCursor:${parishId}`)) as number) ?? 0;
}

export async function putSyncCursor(parishId: string, seq: number): Promise<void> {
  const db = await localdb();
  await db.put("meta", seq, `syncCursor:${parishId}`);
}

// --- Notes ------------------------------------------------------------

export async function notesForDate(
  parishId: string,
  isoDate: string,
): Promise<LocalNote[]> {
  const db = await localdb();
  return db.getAllFromIndex("notes", "byParishDate", [parishId, isoDate]);
}

export async function publicNotesForRange(
  parishId: string,
  startIso: string,
  endIso: string,
): Promise<LocalNote[]> {
  const db = await localdb();
  const range = IDBKeyRange.bound([parishId, startIso], [parishId, endIso]);
  const all = await db.getAllFromIndex("notes", "byParishDate", range);
  return all.filter((n) => n.visibility === "parish_public");
}

export async function upsertNote(note: LocalNote): Promise<void> {
  const db = await localdb();
  await db.put("notes", note);
}

export async function removeNote(noteId: string): Promise<void> {
  const db = await localdb();
  await db.delete("notes", noteId);
}

export async function getNote(noteId: string): Promise<LocalNote | null> {
  const db = await localdb();
  return (await db.get("notes", noteId)) ?? null;
}

// --- Outbox -----------------------------------------------------------

export async function outboxForParish(parishId: string): Promise<OutboxMutation[]> {
  const db = await localdb();
  const all = await db.getAllFromIndex("outbox", "byParish", parishId);
  return all.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function outboxCount(parishId: string): Promise<number> {
  const db = await localdb();
  return db.countFromIndex("outbox", "byParish", parishId);
}

export async function putOutbox(m: OutboxMutation): Promise<void> {
  const db = await localdb();
  await db.put("outbox", m);
}

export async function deleteOutbox(mutationId: string): Promise<void> {
  const db = await localdb();
  await db.delete("outbox", mutationId);
}

/**
 * Coalescing (spec §3.1): rapid successive edits to the same note fold
 * into the not-yet-attempted pending mutation instead of queueing dozens.
 * Once attempted (attempts > 0) a mutation is frozen; the caller then
 * enqueues a fresh one.
 */
export async function pendingMutationForNote(
  parishId: string,
  noteId: string,
): Promise<OutboxMutation | null> {
  const all = await outboxForParish(parishId);
  return all.find((m) => m.noteId === noteId && m.attempts === 0) ?? null;
}

// --- Conflicts --------------------------------------------------------

export async function conflictsForParish(parishId: string): Promise<ConflictEntry[]> {
  const db = await localdb();
  return db.getAllFromIndex("conflicts", "byParish", parishId);
}

export async function putConflict(c: ConflictEntry): Promise<void> {
  const db = await localdb();
  await db.put("conflicts", c);
}

export async function deleteConflict(noteId: string): Promise<void> {
  const db = await localdb();
  await db.delete("conflicts", noteId);
}

// --- Wipe (revocation §1.5 / sign-out) --------------------------------

export async function wipeParish(parishId: string): Promise<void> {
  const db = await localdb();
  const tx = db.transaction(["notes", "outbox", "conflicts", "meta"], "readwrite");
  for (const store of ["notes", "outbox", "conflicts"] as const) {
    let cursor = await tx.objectStore(store).index("byParish").openCursor(parishId);
    while (cursor) {
      await cursor.delete();
      cursor = await cursor.continue();
    }
  }
  await tx.objectStore("meta").delete(`syncCursor:${parishId}`);
  await tx.done;
}

export async function wipeAll(): Promise<void> {
  const db = await localdb();
  const tx = db.transaction(["notes", "outbox", "conflicts", "meta"], "readwrite");
  await tx.objectStore("notes").clear();
  await tx.objectStore("outbox").clear();
  await tx.objectStore("conflicts").clear();
  await tx.objectStore("meta").clear();
  await tx.done;
}
