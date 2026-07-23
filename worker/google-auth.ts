// worker/google-auth.ts
//
// Google Sign-In via OAuth Authorization Code flow, server-side token
// exchange. Adapted from the working implementation in the sibling
// pentecost-app project.
//
// We call Google's userinfo endpoint with the access_token rather than
// verifying the id_token JWT ourselves: the token pair arrives over a
// direct server-to-server TLS call to Google, so re-verifying a JWT
// signature adds nothing. Calling userinfo is the simpler equivalent
// and avoids pulling in a JWT library.
//
// LINT NOTE: this module calls env.DB.prepare() directly, which the
// no-restricted-syntax rule forbids elsewhere. It is exempted in
// eslint.config.js because session/auth rows are NOT parish-scoped
// tenant data -- they are resolved BEFORE a parish (and therefore a
// TenantDB) exists. See the ignores list there for the rationale.

const GOOGLE_AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_ENDPOINT = "https://www.googleapis.com/oauth2/v3/userinfo";

const SESSION_TTL_DAYS = 30;
export const SESSION_COOKIE_NAME = "myordo_session";

export function redirectUri(env: Env): string {
  return `${env.APP_BASE_URL}${env.GOOGLE_REDIRECT_PATH}`;
}

export function buildGoogleAuthUrl(env: Env, state: string): string {
  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri(env),
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "online",
    prompt: "select_account",
  });
  return `${GOOGLE_AUTH_ENDPOINT}?${params.toString()}`;
}

interface GoogleTokenResponse {
  access_token: string;
  id_token: string;
  expires_in: number;
  token_type: string;
}

export interface GoogleUserinfo {
  sub: string;
  email: string;
  email_verified: boolean;
  name?: string;
}

export async function exchangeCodeForUserinfo(
  env: Env,
  code: string,
): Promise<GoogleUserinfo> {
  const tokenRes = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: redirectUri(env),
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    throw new Error(
      `Google token exchange failed: ${tokenRes.status} ${await tokenRes.text()}`,
    );
  }
  const tokens = (await tokenRes.json()) as GoogleTokenResponse;

  const userRes = await fetch(GOOGLE_USERINFO_ENDPOINT, {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  if (!userRes.ok) {
    throw new Error(`Google userinfo fetch failed: ${userRes.status}`);
  }
  const userinfo = (await userRes.json()) as GoogleUserinfo;

  if (!userinfo.email_verified) {
    throw new Error("Google account email is not verified");
  }
  return userinfo;
}

// --- Session management (D1-backed opaque token) ---

export async function createSession(env: Env, userId: string): Promise<string> {
  const sessionId = crypto.randomUUID() + crypto.randomUUID(); // 72 chars, unguessable
  const expiresAt = new Date(
    Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();
  await env.DB.prepare(
    `INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)`,
  )
    .bind(sessionId, userId, expiresAt)
    .run();
  return sessionId;
}

export async function destroySession(
  env: Env,
  sessionId: string,
): Promise<void> {
  await env.DB.prepare(`DELETE FROM sessions WHERE id = ?`)
    .bind(sessionId)
    .run();
}

/**
 * Resolve the user_id for a valid, unexpired session cookie value.
 * Returns null if the session is missing, unknown, or expired.
 */
export async function userIdForSession(
  env: Env,
  sessionId: string,
): Promise<string | null> {
  const row = await env.DB.prepare(
    `SELECT user_id FROM sessions WHERE id = ? AND expires_at > datetime('now')`,
  )
    .bind(sessionId)
    .first<{ user_id: string }>();
  return row?.user_id ?? null;
}

/**
 * Sliding renewal (offline-pwa spec §1.1): extend a valid session to a
 * fresh 30-day window. Called from the sync/me path so any device that
 * checks in keeps its offline window alive; a device that stays offline
 * for the full TTL degrades per spec §1.3 (local write allowed, server
 * rejects until re-auth).
 */
export async function touchSession(env: Env, sessionId: string): Promise<void> {
  const expiresAt = new Date(
    Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();
  await env.DB.prepare(
    `UPDATE sessions SET expires_at = ?1
     WHERE id = ?2 AND expires_at > datetime('now')`,
  )
    .bind(expiresAt, sessionId)
    .run();
}

/** Expiry timestamp for a session (ISO), for the client identity snapshot. */
export async function sessionExpiresAt(
  env: Env,
  sessionId: string,
): Promise<string | null> {
  const row = await env.DB.prepare(
    `SELECT expires_at FROM sessions WHERE id = ?`,
  )
    .bind(sessionId)
    .first<{ expires_at: string }>();
  return row?.expires_at ?? null;
}
