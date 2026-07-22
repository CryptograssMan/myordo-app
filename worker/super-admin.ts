// worker/super-admin.ts
//
// Super-admin authorization. Independent of resolveRequestContext: it
// resolves session -> user -> is-super-admin? and never constructs a
// TenantDB, so it works even for an account with no parish membership and
// can't accidentally widen tenant scoping.
//
// Identity comes from the SUPER_ADMIN_EMAILS env allowlist, matched against
// the OAuth-verified email on the user row (bound at login, §5) -- never
// from request input.

import type { MiddlewareHandler } from "hono";
import { SESSION_COOKIE_NAME, userIdForSession } from "./google-auth.js";
import { SuperAdminDB } from "./super-admin-db.js";

export function isSuperAdminEmail(env: Env, email: string | null | undefined): boolean {
  if (!email) return false;
  const allow = (env.SUPER_ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return allow.includes(email.trim().toLowerCase());
}

function readSessionCookie(request: Request): string | null {
  const cookieHeader = request.headers.get("Cookie") ?? "";
  const match = cookieHeader.match(
    new RegExp(`(?:^|;\\s*)${SESSION_COOKIE_NAME}=([^;]+)`),
  );
  return match ? match[1] : null;
}

export const requireSuperAdmin: MiddlewareHandler<{ Bindings: Env }> = async (c, next) => {
  const sessionId = readSessionCookie(c.req.raw);
  if (!sessionId) return c.json({ error: "Not authenticated" }, 401);

  const userId = await userIdForSession(c.env, sessionId);
  if (!userId) return c.json({ error: "Session expired or invalid" }, 401);

  const user = await new SuperAdminDB(c.env.DB).getUserById(userId);
  if (!user || !isSuperAdminEmail(c.env, user.email)) {
    return c.json({ error: "Forbidden" }, 403);
  }

  c.set("admin", { userId: user.id, email: user.email });
  await next();
};
