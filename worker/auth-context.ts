// worker/auth-context.ts
//
// The ONLY module that resolves a request's tenant context. It reads the
// session cookie, resolves the user, finds their parish membership, and
// hands back a TenantDB instance. Route handlers use that instance only
// and never touch env.DB directly.
//
// Per-request pipeline (architecture §4):
//   1. Verify session cookie -> user_id
//   2. Resolve active parish from parish_memberships
//   3. Construct TenantDB(db, parish_id)

import { TenantDB } from "./tenant-db.js";
import { SESSION_COOKIE_NAME, userIdForSession } from "./google-auth.js";

export class AuthError extends Error {
  public readonly status: 401 | 403;

  constructor(message: string, status: 401 | 403 = 401) {
    super(message);
    this.status = status;
  }
}

export interface RequestContext {
  userId: string;
  parishId: string;
  role: "admin" | "staff";
  userEmail: string;
  parishName: string;
  tenantDb: TenantDB;
}

function readSessionCookie(request: Request): string | null {
  const cookieHeader = request.headers.get("Cookie") ?? "";
  const match = cookieHeader.match(
    new RegExp(`(?:^|;\\s*)${SESSION_COOKIE_NAME}=([^;]+)`),
  );
  return match ? match[1] : null;
}

export async function resolveRequestContext(
  request: Request,
  env: Env,
): Promise<RequestContext> {
  // 1. Verify session cookie -> user_id
  const sessionId = readSessionCookie(request);
  if (!sessionId) {
    throw new AuthError("No session found", 401);
  }
  const userId = await userIdForSession(env, sessionId);
  if (!userId) {
    throw new AuthError("Session expired or invalid", 401);
  }

  // 2. Resolve active parish from parish_memberships
  const { results } = await TenantDB.findMembershipsForUser(env.DB, userId);
  if (!results || results.length === 0) {
    throw new AuthError("No active parish membership found", 403);
  }

  // If a user belongs to multiple parishes, architecture §4 has them
  // select one, stored in the session. Until that UI exists, take the
  // first membership.
  const membership = results[0] as {
    parish_id: string;
    role: "admin" | "staff";
  };

  // 3. Construct TenantDB(db, parish_id)
  const tenantDb = new TenantDB(env.DB, membership.parish_id);
  const info = await tenantDb.displayInfo(userId);

  return {
    userId,
    parishId: membership.parish_id,
    role: membership.role,
    userEmail: info?.email ?? "",
    parishName: info?.parishName ?? "",
    tenantDb,
  };
}
