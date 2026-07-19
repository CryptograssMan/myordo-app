import { AuthError, resolveRequestContext } from "./auth-context";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (!url.pathname.startsWith("/api/")) {
      return new Response(null, { status: 404 });
    }

    let ctx;
    try {
      ctx = await resolveRequestContext(request, env);
    } catch (err) {
      if (err instanceof AuthError) {
        return Response.json({ error: err.message }, { status: err.status });
      }
      throw err;
    }

    // Route handlers below receive `ctx.tenantDb` only. They never see
    // `env.DB` — that binding is confined to auth-context.ts.

    if (url.pathname === "/api/notes" && request.method === "GET") {
      const date = url.searchParams.get("date");
      if (!date) {
        return Response.json({ error: "Missing ?date=YYYY-MM-DD" }, { status: 400 });
      }
      const notes = await ctx.tenantDb.listNotesForDate(date, ctx.userId);
      return Response.json(notes);
    }

    return Response.json({ error: "Not found" }, { status: 404 });
  },
} satisfies ExportedHandler<Env>;
