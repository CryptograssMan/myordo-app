// worker/super-admin-routes.ts
import { Hono } from "hono";
import { SuperAdminDB } from "./super-admin-db.js";
import { requireSuperAdmin } from "./super-admin.js";

export const superAdminRoutes = new Hono<{ Bindings: Env }>();

superAdminRoutes.use("*", requireSuperAdmin);

superAdminRoutes.get("/parishes", async (c) => {
  return c.json(await new SuperAdminDB(c.env.DB).listParishes());
});

superAdminRoutes.post("/parishes", async (c) => {
  const admin = c.get("admin");
  const body = (await c.req.json().catch(() => null)) as {
    name?: string; slug?: string | null; default_language?: string; admin_email?: string;
  } | null;
  const name = body?.name?.trim();
  const adminEmail = body?.admin_email?.trim();
  const lang = body?.default_language;
  const slug = body?.slug?.trim() || null;
  if (!name) return c.json({ error: "name is required" }, 400);
  if (!adminEmail || !adminEmail.includes("@")) return c.json({ error: "a valid admin email is required" }, 400);
  if (lang !== "en" && lang !== "tl") return c.json({ error: "default_language must be 'en' or 'tl'" }, 400);
  try {
    const parish = await new SuperAdminDB(c.env.DB).createParish(admin, {
      name, slug, defaultLanguage: lang, adminEmail,
    });
    return c.json(parish, 201);
  } catch (e) {
    const msg = (e as Error).message;
    if (/UNIQUE/i.test(msg)) return c.json({ error: "That slug is already in use." }, 409);
    return c.json({ error: msg }, 400);
  }
});

superAdminRoutes.get("/parishes/:id", async (c) => {
  const detail = await new SuperAdminDB(c.env.DB).getParishDetail(c.req.param("id"));
  if (!detail) return c.json({ error: "Parish not found" }, 404);
  return c.json(detail);
});

superAdminRoutes.post("/parishes/:id/members", async (c) => {
  const admin = c.get("admin");
  const parishId = c.req.param("id");
  const body = (await c.req.json().catch(() => null)) as { email?: string; role?: string } | null;
  const email = body?.email?.trim();
  const role = body?.role;
  if (!email || !email.includes("@")) return c.json({ error: "a valid email is required" }, 400);
  if (role !== "admin" && role !== "staff") return c.json({ error: "role must be 'admin' or 'staff'" }, 400);
  try {
    const member = await new SuperAdminDB(c.env.DB).inviteMember(admin, parishId, email, role);
    return c.json(member, 201);
  } catch (e) {
    const msg = (e as Error).message;
    if (/UNIQUE/i.test(msg)) return c.json({ error: "That email is already a member of this parish." }, 409);
    if (/not found/i.test(msg)) return c.json({ error: msg }, 404);
    return c.json({ error: msg }, 400);
  }
});

superAdminRoutes.patch("/memberships/:id/role", async (c) => {
  const admin = c.get("admin");
  const body = (await c.req.json().catch(() => null)) as { role?: string } | null;
  if (body?.role !== "admin" && body?.role !== "staff") {
    return c.json({ error: "role must be 'admin' or 'staff'" }, 400);
  }
  try {
    return c.json(await new SuperAdminDB(c.env.DB).updateMembershipRole(admin, c.req.param("id"), body.role));
  } catch (e) {
    return c.json({ error: (e as Error).message }, 404);
  }
});

superAdminRoutes.patch("/memberships/:id/status", async (c) => {
  const admin = c.get("admin");
  const body = (await c.req.json().catch(() => null)) as { status?: string } | null;
  const status = body?.status;
  if (status !== "invited" && status !== "active" && status !== "revoked") {
    return c.json({ error: "status must be 'invited' | 'active' | 'revoked'" }, 400);
  }
  try {
    return c.json(await new SuperAdminDB(c.env.DB).updateMembershipStatus(admin, c.req.param("id"), status));
  } catch (e) {
    return c.json({ error: (e as Error).message }, 404);
  }
});

superAdminRoutes.patch("/parishes/:id/subscription", async (c) => {
  const admin = c.get("admin");
  const body = (await c.req.json().catch(() => null)) as { subscription_status?: string } | null;
  const sub = body?.subscription_status;
  if (sub !== "active" && sub !== "past_due" && sub !== "canceled") {
    return c.json({ error: "subscription_status must be 'active' | 'past_due' | 'canceled'" }, 400);
  }
  try {
    return c.json(await new SuperAdminDB(c.env.DB).updateParishSubscriptionStatus(admin, c.req.param("id"), sub));
  } catch (e) {
    return c.json({ error: (e as Error).message }, 404);
  }
});

superAdminRoutes.get("/audit", async (c) => {
  return c.json(await new SuperAdminDB(c.env.DB).listAuditLog());
});
