import { Hono } from "hono";
import { AuthError, resolveRequestContext } from "./auth-context.js";
import { authRoutes } from "./auth-routes.js";

const app = new Hono<{ Bindings: Env }>();

// Google Sign-In endpoints (public — no session required to reach them).
app.route("/auth", authRoutes);

// All /api/* routes require a resolved tenant context. This middleware
// runs resolveRequestContext once and stashes it for the handlers.
app.use("/api/*", async (c, next) => {
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

// Who am I + which parish am I acting in.
app.get("/api/me", (c) => {
  const ctx = c.get("ctx");
  return c.json({
    userId: ctx.userId,
    parishId: ctx.parishId,
    role: ctx.role,
  });
});

app.get("/api/notes", async (c) => {
  const ctx = c.get("ctx");
  const date = c.req.query("date");
  if (!date) {
    return c.json({ error: "Missing ?date=YYYY-MM-DD" }, 400);
  }
  const notes = await ctx.tenantDb.listNotesForDate(date, ctx.userId);
  return c.json(notes);
});

app.all("/api/*", (c) => c.json({ error: "Not found" }, 404));

export default app;
