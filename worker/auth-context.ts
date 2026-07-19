// worker/auth-context.ts
//
// This is the ONLY module that touches the raw `env.DB` binding for
// the purpose of resolving a request's tenant context. Once it hands
// back a `TenantDB` instance, route handlers use that instance only.
//
// Per-request pipeline (architecture §4):
//   1. Verify session -> user_id
//   2. Resolve active parish from parish_memberships
//   3. Construct TenantDB(db, parish_id)

import { TenantDB } from "./tenant-db";

export class AuthError extends Error {
  constructor(
    message: string,
    public readonly status: 401 | 403 = 401,
  ) {
    super(message);
  }
}

export interface RequestContext {
  userId: string;
  parishId: string;
  role: "admin" | "staff";
  tenantDb: TenantDB;
}

/**
 * STUB: replace with real Google OAuth session verification.
 * For now, reads a `x-debug-user-id` header so we can exercise the
 * pipeline locally before SSO is wired up. This must never ship to
 * production as-is.
 */
function verifySession(request: Request): string {
  const userId = request.headers.get("x-debug-user-id");
  if (!userId) {
    throw new AuthError("No session found", 401);
  }
  return userId;
}

export async function resolveRequestContext(
  request: Request,
  env: Env,
): Promise<RequestContext> {
  // 1. Verify session -> user_id
  const userId = verifySession(request);

  // 2. Resolve active parish from parish_memberships
  const { results } = await TenantDB.findMembershipsForUser(env.DB, userId);

  if (!results || results.length === 0) {
    throw new AuthError("No active parish membership found", 403);
  }

  // If a user belongs to multiple parishes, architecture §4 has them
  // select one and stores it in the session. Until that UI exists,
  // take the first membership.
  const membership = results[0] as {
    parish_id: string;
    role: "admin" | "staff";
  };

  // 3. Construct TenantDB(db, parish_id)
  const tenantDb = new TenantDB(env.DB, membership.parish_id);

  return {
    userId,
    parishId: membership.parish_id,
    role: membership.role,
    tenantDb,
  };
}
