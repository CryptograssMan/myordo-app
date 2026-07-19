// Typing for values stashed on the Hono context via c.set(...).
import type { RequestContext } from "./auth-context";

declare module "hono" {
  interface ContextVariableMap {
    ctx: RequestContext;
  }
}
