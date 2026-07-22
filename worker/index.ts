import { Hono } from "hono";
import { AuthError, resolveRequestContext } from "./auth-context.js";
import { authRoutes } from "./auth-routes.js";
import { NotePermissionError } from "./tenant-db.js";
import { superAdminRoutes } from "./super-admin-routes.js";
import { isSuperAdminEmail } from "./super-admin.js";

const app = new Hono<{ Bindings: Env }>();

app.route("/auth", authRoutes);

// All /api/* routes require a resolved tenant context.
app.use("/api/*", async (c, next) => {
  // Super-admin routes are NOT parish-scoped; they authorize themselves
  // via requireSuperAdmin. Skip tenant-context resolution for them.
  if (c.req.path.startsWith("/api/admin")) return next();
  try {
    const ctx = await resolveRequestContext(c.req.raw, c.env);
    c.set("ctx", ctx);
  } catch (err) {
    if (err instanceof AuthError) {
      return c.json({ error: err.message }, err.status);
    }
    throw err;
  }
  await next();
});

app.get("/api/me", (c) => {
  const ctx = c.get("ctx");
  return c.json({
    userId: ctx.userId,
    parishId: ctx.parishId,
    role: ctx.role,
    email: ctx.userEmail,
    parishName: ctx.parishName,
    isSuperAdmin: isSuperAdminEmail(c.env, ctx.userEmail),
  });
});

app.get("/api/notes/month", async (c) => {
  const ctx = c.get("ctx");
  const start = c.req.query("start");
  const end = c.req.query("end");
  if (!start || !end) {
    return c.json({ error: "Missing ?start=YYYY-MM-DD&end=YYYY-MM-DD" }, 400);
  }
  const notes = await ctx.tenantDb.listPublicNotesForMonth(start, end);
  return c.json(notes);
});

app.get("/api/notes", async (c) => {
  const ctx = c.get("ctx");
  const date = c.req.query("date");
  if (!date) return c.json({ error: "Missing ?date=YYYY-MM-DD" }, 400);
  const notes = await ctx.tenantDb.listNotesForDate(date, ctx.userId);
  return c.json(notes);
});

// Create a note. Role gate is PRIMARY here; TenantDB throws as backstop.
app.post("/api/notes", async (c) => {
  const ctx = c.get("ctx");
  const body = await c.req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return c.json({ error: "Invalid JSON body" }, 400);
  }
  const { visibility, liturgicalDate, title, note } = body as {
    visibility?: string;
    liturgicalDate?: string;
    title?: string | null;
    note?: string | null;
  };

  if (visibility !== "private" && visibility !== "parish_public") {
    return c.json({ error: "visibility must be 'private' or 'parish_public'" }, 400);
  }
  if (!liturgicalDate) {
    return c.json({ error: "liturgicalDate is required (YYYY-MM-DD)" }, 400);
  }
  // PRIMARY role gate: only admins may write parish-public notes.
  if (visibility === "parish_public" && ctx.role !== "admin") {
    return c.json({ error: "Only admins can create parish-public notes" }, 403);
  }

  try {
    const id = crypto.randomUUID();
    await ctx.tenantDb.createNote({
      id,
      userId: ctx.userId,
      role: ctx.role,
      visibility,
      liturgicalDate,
      title: title ?? null,
      body: note ?? null,
    });
    return c.json({ id }, 201);
  } catch (err) {
    if (err instanceof NotePermissionError) {
      return c.json({ error: err.message }, 403);
    }
    throw err;
  }
});

// Edit a note. Authorization enforced in TenantDB (private=author,
// public=admin); we surface its NotePermissionError as 403.
app.patch("/api/notes/:id", async (c) => {
  const ctx = c.get("ctx");
  const noteId = c.req.param("id");
  const body = await c.req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return c.json({ error: "Invalid JSON body" }, 400);
  }
  const { title, note } = body as { title?: string | null; note?: string | null };
  try {
    await ctx.tenantDb.updateNote({
      noteId,
      userId: ctx.userId,
      role: ctx.role,
      title: title ?? null,
      body: note ?? null,
    });
    return c.json({ ok: true });
  } catch (err) {
    if (err instanceof NotePermissionError) {
      return c.json({ error: err.message }, 403);
    }
    throw err;
  }
});

app.delete("/api/notes/:id", async (c) => {
  const ctx = c.get("ctx");
  const noteId = c.req.param("id");
  try {
    await ctx.tenantDb.deleteNote({ noteId, userId: ctx.userId, role: ctx.role });
    return c.json({ ok: true });
  } catch (err) {
    if (err instanceof NotePermissionError) {
      return c.json({ error: err.message }, 403);
    }
    throw err;
  }
});

// Super-admin console API. Self-gated by requireSuperAdmin inside the
// router; mounted before the /api/* 404 catch-all below.
app.route("/api/admin", superAdminRoutes);

app.all("/api/*", (c) => c.json({ error: "Not found" }, 404));

export default app;
