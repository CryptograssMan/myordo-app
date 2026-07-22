// Typing for values stashed on the Hono context via c.set(...).
import type { RequestContext } from "./auth-context";
import type { AdminActor } from "./super-admin-db";

declare module "hono" {
  interface ContextVariableMap {
    ctx: RequestContext;
    admin: AdminActor;
  }
}
