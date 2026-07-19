// worker/auth-routes.ts
//
// Google Sign-In endpoints: /auth/google/login, /auth/google/callback,
// /auth/logout. Uses Hono for routing + cookie handling.
//
// DIVERGES FROM pentecost-app DELIBERATELY: pentecost is open signup
// (any Google user gets a new users row). myORDO is invite-only per
// architecture §5 -- a parish_memberships row is SEEDED (status
// 'invited') at provisioning/invite time keyed by email. Login only
// BINDS a Google identity to that pre-seeded email and flips the
// membership to 'active'. A Google user with no seeded membership is
// rejected; we never create unsolicited accounts.
//
// LINT NOTE: exempt from the raw-.prepare() rule (see eslint.config.js)
// -- these are identity/membership binding queries, not parish-scoped
// tenant data, and run before a TenantDB exists.

import { Hono } from "hono";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import {
  buildGoogleAuthUrl,
  exchangeCodeForUserinfo,
  createSession,
  destroySession,
  SESSION_COOKIE_NAME,
} from "./google-auth.js";

export const authRoutes = new Hono<{ Bindings: Env }>();

authRoutes.get("/google/login", (c) => {
  const state = crypto.randomUUID();
  setCookie(c, "oauth_state", state, {
    httpOnly: true,
    secure: true,
    sameSite: "Lax",
    maxAge: 600, // 10 min, just needs to survive the redirect round trip
    path: "/",
  });
  return c.redirect(buildGoogleAuthUrl(c.env, state));
});

authRoutes.get("/google/callback", async (c) => {
  const code = c.req.query("code");
  const state = c.req.query("state");
  const expectedState = getCookie(c, "oauth_state");
  deleteCookie(c, "oauth_state", { path: "/" });

  if (!code || !state || state !== expectedState) {
    return c.json(
      { error: "invalid_state", message: "OAuth state mismatch. Please try signing in again." },
      400,
    );
  }

  let userinfo;
  try {
    userinfo = await exchangeCodeForUserinfo(c.env, code);
  } catch (err) {
    return c.json({ error: "google_auth_failed", message: String(err) }, 502);
  }

  // INVITE-ONLY GATE: the email must already have a seeded membership.
  const membership = await c.env.DB.prepare(
    `SELECT id, user_id FROM parish_memberships
     WHERE email = ? AND status IN ('invited','active')`,
  )
    .bind(userinfo.email)
    .first<{ id: string; user_id: string | null }>();

  if (!membership) {
    return c.json(
      {
        error: "not_invited",
        message:
          "This Google account is not associated with any parish on myORDO. " +
          "Please ask your parish administrator to invite you.",
      },
      403,
    );
  }

  // Resolve or create the users row, and bind google_sub.
  let userId: string;
  const existingUser = await c.env.DB.prepare(
    `SELECT id FROM users WHERE google_sub = ? OR email = ?`,
  )
    .bind(userinfo.sub, userinfo.email)
    .first<{ id: string }>();

  if (existingUser) {
    userId = existingUser.id;
    await c.env.DB.prepare(
      `UPDATE users SET google_sub = ?, display_name = COALESCE(display_name, ?) WHERE id = ?`,
    )
      .bind(userinfo.sub, userinfo.name ?? null, userId)
      .run();
  } else {
    userId = crypto.randomUUID();
    await c.env.DB.prepare(
      `INSERT INTO users (id, email, display_name, google_sub, created_at)
       VALUES (?, ?, ?, ?, datetime('now'))`,
    )
      .bind(userId, userinfo.email, userinfo.name ?? null, userinfo.sub)
      .run();
  }

  // Activate the membership: link the user_id and flip 'invited' -> 'active'.
  await c.env.DB.prepare(
    `UPDATE parish_memberships
     SET user_id = ?, status = 'active'
     WHERE id = ?`,
  )
    .bind(userId, membership.id)
    .run();

  const sessionId = await createSession(c.env, userId);
  setCookie(c, SESSION_COOKIE_NAME, sessionId, {
    httpOnly: true,
    secure: true,
    sameSite: "Lax",
    maxAge: 30 * 86400,
    path: "/",
  });

  return c.redirect(`${c.env.APP_BASE_URL}/`);
});

authRoutes.post("/logout", async (c) => {
  const sessionId = getCookie(c, SESSION_COOKIE_NAME);
  if (sessionId) await destroySession(c.env, sessionId);
  deleteCookie(c, SESSION_COOKIE_NAME, { path: "/" });
  return c.json({ ok: true });
});
