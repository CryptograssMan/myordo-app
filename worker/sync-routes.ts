// worker/sync-routes.ts
//
// Offline sync endpoints (offline-pwa spec §3.3). Mounted under
// /api/sync/* so wrangler's run_worker_first (/api/*) routes them to the
// Worker. Both routes run behind the standard tenant-context middleware:
// parish scoping comes from the verified session via ctx.tenantDb, and
// any parishId in the request body/query is IGNORED — the client cannot
// ask for another parish's data by editing a parameter (architecture §4).
//
// No raw D1 access here — everything goes through TenantDB (lint-enforced).

import { Hono } from "hono";
import type { SyncMutation } from "./tenant-db.js";

export const syncRoutes = new Hono<{ Bindings: Env }>();

const MAX_BATCH = 50;

function isValidMutation(m: unknown): m is SyncMutation {
  if (!m || typeof m !== "object") return false;
  const x = m as Record<string, unknown>;
  return (
    typeof x.mutationId === "string" &&
    x.mutationId.length > 0 &&
    x.mutationId.length <= 64 &&
    (x.type === "create" || x.type === "update" || x.type === "delete") &&
    typeof x.noteId === "string" &&
    x.noteId.length > 0 &&
    typeof x.baseVersion === "number" &&
    Number.isInteger(x.baseVersion) &&
    x.baseVersion >= 0
  );
}

// POST /api/sync/push — apply the client's outbox in order.
syncRoutes.post("/push", async (c) => {
  const ctx = c.get("ctx");
  const body = await c.req.json().catch(() => null);
  const mutations = (body as { mutations?: unknown[] } | null)?.mutations;
  if (!Array.isArray(mutations)) {
    return c.json({ error: "Body must be { mutations: Mutation[] }" }, 400);
  }
  if (mutations.length > MAX_BATCH) {
    return c.json({ error: `Max ${MAX_BATCH} mutations per batch` }, 400);
  }

  const results = [];
  for (const raw of mutations) {
    if (!isValidMutation(raw)) {
      const id =
        raw && typeof raw === "object" && typeof (raw as Record<string, unknown>).mutationId === "string"
          ? ((raw as Record<string, unknown>).mutationId as string)
          : "unknown";
      results.push({
        status: "rejected" as const,
        mutationId: id,
        noteId: "",
        reason: "invalid_mutation",
      });
      continue;
    }
    // Sequential on purpose: the outbox is causally ordered (a create
    // must land before updates to the same note).
    results.push(
      await ctx.tenantDb.applyMutation({
        mutation: raw,
        userId: ctx.userId,
        role: ctx.role,
      }),
    );
  }
  return c.json({ results });
});

// GET /api/sync/pull?since={seq}&limit={n} — page of changed notes.
// since=0 is the full bootstrap; incremental sync is the same code path.
syncRoutes.get("/pull", async (c) => {
  const ctx = c.get("ctx");
  const since = Number(c.req.query("since") ?? "0");
  const limit = Number(c.req.query("limit") ?? "200");
  if (!Number.isFinite(since) || since < 0) {
    return c.json({ error: "since must be a non-negative integer" }, 400);
  }
  const page = await ctx.tenantDb.pullChanges({
    sinceSeq: Math.floor(since),
    limit: Number.isFinite(limit) ? Math.floor(limit) : 200,
    userId: ctx.userId,
  });
  return c.json(page);
});
