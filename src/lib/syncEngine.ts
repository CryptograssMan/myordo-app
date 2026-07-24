// src/lib/syncEngine.ts
//
// The ONLY module that talks to /api/sync/* and /api/me over the network
// (offline-pwa spec §3.4) — the client counterpart of the server's
// TenantDB choke point. Everything else reads and writes IndexedDB via
// localdb.ts and subscribes to this module's change events.
//
// Cycle (serialized under a Web Lock so tabs never double-push):
//   1. GET /api/me      → refresh snapshot; handle revocation / 401
//   2. POST /sync/push  → drain the outbox (applied/conflict/rejected)
//   3. GET  /sync/pull  → page changes since cursor, upsert, advance
// Always push before pull: pulling first would overwrite local base
// state under pending mutations and manufacture false conflicts.

import {
  deleteOutbox,
  getNote,
  getSnapshot,
  getSyncCursor,
  outboxForParish,
  putConflict,
  putOutbox,
  putSnapshot,
  putSyncCursor,
  removeNote,
  upsertNote,
  wipeParish,
  type IdentitySnapshot,
  type LocalNote,
  type OutboxMutation,
} from "./localdb";

// --- Events -----------------------------------------------------------

/**
 * "offline"       — the network is unreachable (fetch threw).
 * "error"         — the server RESPONDED with a failure. We are online;
 *                   saying "offline" here would be a lie to the user.
 * "auth_required" — session invalid; needs an online sign-in.
 */
export type SyncStatus = "idle" | "syncing" | "offline" | "auth_required" | "error";

type Reach = "ok" | "auth_required" | "network_error" | "server_error";

interface SyncState {
  status: SyncStatus;
  lastSyncAt: string | null;
  pendingCount: number;
}

type Listener = () => void;
const listeners = new Set<Listener>();
let state: SyncState = { status: "idle", lastSyncAt: null, pendingCount: 0 };

export function syncState(): SyncState {
  return state;
}

export function subscribeSync(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function emit(patch: Partial<SyncState>) {
  state = { ...state, ...patch };
  for (const fn of listeners) fn();
}

/** Data changed locally (after a pull or local write) — re-render. */
export function notifyDataChanged() {
  for (const fn of listeners) fn();
}

// --- /api/me snapshot refresh ----------------------------------------

interface MeResponse {
  userId: string;
  parishId: string;
  role: "admin" | "staff";
  email: string;
  parishName: string;
  isSuperAdmin: boolean;
  displayName: string | null;
  preferredLanguage: "en" | "tl" | null;
  memberships: Array<{
    parishId: string;
    parishName: string;
    role: "admin" | "staff";
    defaultLanguage: "en" | "tl";
    subscriptionStatus: "active" | "past_due" | "canceled";
  }>;
  sessionExpiresAt: string | null;
  snapshotFetchedAt: string;
}

/**
 * Refresh the identity snapshot from the server. Returns:
 *  - 'ok'            snapshot refreshed
 *  - 'auth_required' session invalid/expired (401/403) — outbox is kept
 *  - 'offline'       network unreachable
 * Revocation handling (§1.5): any parish present in the cached snapshot
 * but absent from the fresh one has been revoked — its local partition
 * (notes, outbox, conflicts, cursor) is wiped.
 */
export async function refreshSnapshot(): Promise<Reach> {
  let res: Response;
  try {
    res = await fetch("/api/me");
  } catch {
    return "network_error"; // genuinely unreachable
  }
  if (res.status === 401 || res.status === 403) return "auth_required";
  // The server answered — we are online, whatever it said.
  if (!res.ok) return "server_error";

  const me = (await res.json()) as MeResponse;
  const prior = await getSnapshot();

  // Revocation wipe: parishes that disappeared from the membership list.
  if (prior) {
    const fresh = new Set(me.memberships.map((m) => m.parishId));
    for (const m of prior.memberships) {
      if (!fresh.has(m.parishId)) await wipeParish(m.parishId);
    }
  }

  const snapshot: IdentitySnapshot = {
    userId: me.userId,
    email: me.email,
    displayName: me.displayName,
    preferredLanguage: me.preferredLanguage,
    isSuperAdmin: me.isSuperAdmin,
    memberships: me.memberships,
    activeParishId: me.parishId,
    activeRole: me.role,
    activeParishName: me.parishName,
    sessionExpiresAt: me.sessionExpiresAt,
    snapshotFetchedAt: me.snapshotFetchedAt,
  };
  await putSnapshot(snapshot);
  return "ok";
}

// --- Push -------------------------------------------------------------

interface PushResultApplied {
  status: "applied";
  mutationId: string;
  noteId: string;
  newVersion: number;
  updatedAt: string;
}
interface PushResultConflict {
  status: "conflict";
  mutationId: string;
  noteId: string;
  serverVersion: number;
  serverTitle: string | null;
  serverBody: string | null;
  serverUpdatedAt: string;
}
interface PushResultRejected {
  status: "rejected";
  mutationId: string;
  noteId: string;
  reason: string;
}
type PushResult = PushResultApplied | PushResultConflict | PushResultRejected;

async function pushOutbox(parishId: string): Promise<Reach> {
  const outbox = await outboxForParish(parishId);
  if (outbox.length === 0) return "ok";

  for (let i = 0; i < outbox.length; i += 50) {
    const batch = outbox.slice(i, i + 50);
    let res: Response;
    try {
      res = await fetch("/api/sync/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mutations: batch.map((m) => ({
            mutationId: m.mutationId,
            type: m.type,
            noteId: m.noteId,
            baseVersion: m.baseVersion,
            payload: m.payload,
          })),
        }),
      });
    } catch {
      await markAttempted(batch, "network");
      return "network_error";
    }
    if (res.status === 401 || res.status === 403) return "auth_required";
    if (!res.ok) {
      await markAttempted(batch, `http_${res.status}`);
      return "server_error";
    }

    const { results } = (await res.json()) as { results: PushResult[] };
    for (const r of results) {
      const mutation = batch.find((m) => m.mutationId === r.mutationId);
      await deleteOutbox(r.mutationId);

      if (r.status === "applied") {
        const local = await getNote(r.noteId);
        if (local) {
          const stillPending = (await outboxForParish(parishId)).some(
            (m) => m.noteId === r.noteId,
          );
          await upsertNote({
            ...local,
            version: r.newVersion,
            updated_at: r.updatedAt,
            dirty: stillPending,
          });
        }
      } else if (r.status === "conflict") {
        await putConflict({
          noteId: r.noteId,
          parishId,
          kind: "conflict",
          mineTitle: mutation?.payload?.title ?? null,
          mineBody: mutation?.payload?.body ?? null,
          serverVersion: r.serverVersion,
          serverTitle: r.serverTitle,
          serverBody: r.serverBody,
          createdAt: new Date().toISOString(),
        });
        // Take the server's copy locally; the user's text lives in the
        // conflict entry (and in note_revisions server-side).
        const local = await getNote(r.noteId);
        await upsertNote({
          id: r.noteId,
          parishId,
          visibility: local?.visibility ?? "parish_public",
          liturgical_date: local?.liturgical_date ?? "",
          title: r.serverTitle,
          body: r.serverBody,
          version: r.serverVersion,
          updated_at: r.serverUpdatedAt,
          author_user_id: local?.author_user_id ?? "",
          attribution: local?.attribution ?? null,
          dirty: false,
        });
      } else {
        // Rejected — preserve the text so nothing silently vanishes.
        if (mutation?.payload) {
          await putConflict({
            noteId: r.noteId,
            parishId,
            kind: "rejected",
            reason: r.reason,
            mineTitle: mutation.payload.title ?? null,
            mineBody: mutation.payload.body ?? null,
            createdAt: new Date().toISOString(),
          });
        }
      }
    }
  }
  return "ok";
}

async function markAttempted(batch: OutboxMutation[], error: string) {
  for (const m of batch) {
    m.attempts += 1;
    m.lastError = error;
    await putOutbox(m);
  }
}

// --- Pull -------------------------------------------------------------

interface PullPage {
  changes: Array<{
    id: string;
    visibility: "private" | "parish_public";
    liturgical_date: string;
    title: string | null;
    body: string | null;
    version: number;
    updated_at: string;
    deleted_at: string | null;
    author_user_id: string;
    attribution: string | null;
  }>;
  nextSince: number;
  hasMore: boolean;
}

async function pullChanges(parishId: string): Promise<Reach> {
  for (;;) {
    const since = await getSyncCursor(parishId);
    let res: Response;
    try {
      res = await fetch(`/api/sync/pull?since=${since}&limit=200`);
    } catch {
      return "network_error";
    }
    if (res.status === 401 || res.status === 403) return "auth_required";
    if (!res.ok) return "server_error";
    const page = (await res.json()) as PullPage;

    const pending = await outboxForParish(parishId);
    const pendingNoteIds = new Set(pending.map((m) => m.noteId));

    for (const n of page.changes) {
      if (n.deleted_at !== null) {
        // Tombstone. If we still have a pending edit for this note, keep
        // the local copy — the push will hit the conflict path, correctly.
        if (!pendingNoteIds.has(n.id)) await removeNote(n.id);
        continue;
      }
      const local = await getNote(n.id);
      if (pendingNoteIds.has(n.id) && local) {
        // Never clobber a note with un-pushed local edits; only lift the
        // server version so the eventual push carries a fresh baseVersion
        // comparison server-side.
        continue;
      }
      const note: LocalNote = {
        id: n.id,
        parishId,
        visibility: n.visibility,
        liturgical_date: n.liturgical_date,
        title: n.title,
        body: n.body,
        version: n.version,
        updated_at: n.updated_at,
        author_user_id: n.author_user_id,
        attribution: n.attribution,
        dirty: false,
      };
      await upsertNote(note);
    }
    await putSyncCursor(parishId, page.nextSince);
    if (!page.hasMore) return "ok";
  }
}

// --- The cycle --------------------------------------------------------

let backoffMs = 0;
let backoffTimer: ReturnType<typeof setTimeout> | null = null;

export async function syncNow(): Promise<void> {
  // Web Lock: one cycle at a time, across tabs (spec §7 multiple-tabs).
  // NOTE: locks are per-ORIGIN, so an installed PWA window and an open
  // browser tab contend with each other. ifAvailable means we skip
  // rather than queue — fine, because the other holder is doing the same
  // work. But the skip must not leave a stale status behind, so callers
  // that need certainty use forceSync().
  await navigator.locks.request("myordo-sync", { ifAvailable: true }, async (lock) => {
    if (!lock) return;
    await runCycle();
  });
}

/** Wait for the lock rather than skipping. Used by explicit user retry. */
export async function forceSync(): Promise<void> {
  backoffMs = 0;
  if (backoffTimer) clearTimeout(backoffTimer);
  await navigator.locks.request("myordo-sync", async () => {
    await runCycle();
  });
}

async function runCycle(): Promise<void> {
  const snapshot = await getSnapshot();
  if (!snapshot) return; // never logged in on this device

  emit({ status: "syncing" });

  // Map a reachability result onto user-visible status. Only a thrown
  // fetch means "offline"; a server response means we ARE online.
  const fail = async (r: Reach) => {
    emit({
      status: r === "network_error" ? "offline" : "error",
      pendingCount: await pendingTotal(),
    });
    scheduleBackoff();
  };

  const auth = await refreshSnapshot();
  if (auth === "network_error" || auth === "server_error") {
    await fail(auth);
    return;
  }
  if (auth === "auth_required") {
    // Session expired/invalid: outbox is preserved; the user keeps
    // working locally (spec §1.3) and must sign in online to flush.
    emit({ status: "auth_required", pendingCount: await pendingTotal() });
    return;
  }

  const fresh = await getSnapshot();
  const parishIds = fresh?.memberships.map((m) => m.parishId) ?? [];

  for (const parishId of parishIds) {
    const pushed = await pushOutbox(parishId);
    if (pushed === "network_error" || pushed === "server_error") {
      await fail(pushed);
      return;
    }
    if (pushed === "auth_required") {
      emit({ status: "auth_required", pendingCount: await pendingTotal() });
      return;
    }
    const pulled = await pullChanges(parishId);
    if (pulled === "network_error" || pulled === "server_error") {
      await fail(pulled);
      return;
    }
    if (pulled === "auth_required") {
      emit({ status: "auth_required", pendingCount: await pendingTotal() });
      return;
    }
  }

  backoffMs = 0;
  emit({
    status: "idle",
    lastSyncAt: new Date().toISOString(),
    pendingCount: await pendingTotal(),
  });
}

async function pendingTotal(): Promise<number> {
  const snapshot = await getSnapshot();
  if (!snapshot) return 0;
  let total = 0;
  for (const m of snapshot.memberships) {
    total += (await outboxForParish(m.parishId)).length;
  }
  return total;
}

function scheduleBackoff() {
  backoffMs = backoffMs === 0 ? 60_000 : Math.min(backoffMs * 2, 30 * 60_000);
  if (backoffTimer) clearTimeout(backoffTimer);
  backoffTimer = setTimeout(() => void syncNow(), backoffMs);
}

// --- Triggers (spec §3.4) ---------------------------------------------

let started = false;

export function startSyncTriggers(): void {
  if (started) return;
  started = true;

  window.addEventListener("online", () => {
    backoffMs = 0; // don't sit in a long backoff after reconnecting
    if (backoffTimer) clearTimeout(backoffTimer);
    void syncNow();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") void syncNow();
  });
  setInterval(() => {
    if (navigator.onLine) void syncNow();
  }, 5 * 60_000);

  // Progressive enhancement only — iOS Safari has no Background Sync.
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.ready
      .then((reg) => {
        const syncReg = (reg as unknown as {
          sync?: { register: (tag: string) => Promise<void> };
        }).sync;
        return syncReg?.register("myordo-sync");
      })
      .catch(() => {});
  }

  // First run.
  if (navigator.onLine) void syncNow();

  // Ask for durable storage once (Safari ignores this; fine).
  navigator.storage?.persist?.().catch(() => {});
}
