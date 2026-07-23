// src/lib/noteActions.ts
//
// LOCAL-FIRST write actions (offline-pwa spec §2/§3.1). Each action:
//   1. writes the note to IndexedDB immediately (optimistic UI),
//   2. enqueues (or coalesces into) an outbox mutation,
//   3. kicks the sync engine if we're online.
// The server remains the authority: version checks, permission matrix,
// and conflict policy all happen at push time. These never touch fetch().

import {
  getNote,
  getSnapshot,
  pendingMutationForNote,
  putOutbox,
  upsertNote,
  removeNote,
  type LocalNote,
} from "./localdb";
import { notifyDataChanged, syncNow } from "./syncEngine";

export interface SaveResult {
  ok: boolean;
  error?: string;
}

function kick() {
  notifyDataChanged();
  if (navigator.onLine) void syncNow();
}

export async function createNote(input: {
  visibility: "private" | "parish_public";
  liturgicalDate: string;
  title: string | null;
  note: string | null;
}): Promise<SaveResult> {
  const snapshot = await getSnapshot();
  if (!snapshot) return { ok: false, error: "Not signed in" };

  // Advisory client-side gate (server enforces for real at push).
  if (input.visibility === "parish_public" && snapshot.activeRole !== "admin") {
    return { ok: false, error: "Only admins can create parish-public notes" };
  }

  const noteId = crypto.randomUUID();
  const parishId = snapshot.activeParishId;
  const now = new Date().toISOString();

  const local: LocalNote = {
    id: noteId,
    parishId,
    visibility: input.visibility,
    liturgical_date: input.liturgicalDate,
    title: input.title,
    body: input.note,
    version: 0, // never synced
    updated_at: now,
    author_user_id: snapshot.userId,
    attribution: input.visibility === "parish_public" ? snapshot.email.split("@")[0] : null,
    dirty: true,
  };
  await upsertNote(local);
  await putOutbox({
    mutationId: crypto.randomUUID(),
    parishId,
    userId: snapshot.userId,
    type: "create",
    noteId,
    baseVersion: 0,
    payload: {
      visibility: input.visibility,
      liturgicalDate: input.liturgicalDate,
      title: input.title,
      body: input.note,
    },
    createdAt: now,
    attempts: 0,
  });
  kick();
  return { ok: true };
}

export async function updateNote(
  id: string,
  input: { title: string | null; note: string | null },
): Promise<SaveResult> {
  const snapshot = await getSnapshot();
  if (!snapshot) return { ok: false, error: "Not signed in" };
  const local = await getNote(id);
  if (!local) return { ok: false, error: "Note not found on this device" };

  if (local.visibility === "parish_public" && snapshot.activeRole !== "admin") {
    return { ok: false, error: "Only admins can edit parish-public notes" };
  }
  if (local.visibility === "private" && local.author_user_id !== snapshot.userId) {
    return { ok: false, error: "You can only edit your own private notes" };
  }

  const now = new Date().toISOString();
  await upsertNote({ ...local, title: input.title, body: input.note, dirty: true });

  // Coalesce into a not-yet-attempted mutation for this note if one exists.
  const pending = await pendingMutationForNote(local.parishId, id);
  if (pending && (pending.type === "update" || pending.type === "create")) {
    pending.payload = {
      ...pending.payload,
      title: input.title,
      body: input.note,
    };
    await putOutbox(pending);
  } else {
    await putOutbox({
      mutationId: crypto.randomUUID(),
      parishId: local.parishId,
      userId: snapshot.userId,
      type: "update",
      noteId: id,
      baseVersion: local.version,
      payload: { title: input.title, body: input.note },
      createdAt: now,
      attempts: 0,
    });
  }
  kick();
  return { ok: true };
}

export async function deleteNote(id: string): Promise<SaveResult> {
  const snapshot = await getSnapshot();
  if (!snapshot) return { ok: false, error: "Not signed in" };
  const local = await getNote(id);
  if (!local) return { ok: false, error: "Note not found on this device" };

  if (local.visibility === "parish_public" && snapshot.activeRole !== "admin") {
    return { ok: false, error: "Only admins can delete parish-public notes" };
  }
  if (local.visibility === "private" && local.author_user_id !== snapshot.userId) {
    return { ok: false, error: "You can only delete your own private notes" };
  }

  await removeNote(id);
  await putOutbox({
    mutationId: crypto.randomUUID(),
    parishId: local.parishId,
    userId: snapshot.userId,
    type: "delete",
    noteId: id,
    baseVersion: local.version,
    payload: null,
    createdAt: new Date().toISOString(),
    attempts: 0,
  });
  kick();
  return { ok: true };
}
