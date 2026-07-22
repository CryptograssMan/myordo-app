// Augments the wrangler-generated Env with the super-admin allowlist.
// SUPER_ADMIN_EMAILS is a Worker secret (not in wrangler.jsonc), so it
// isn't emitted by `wrangler types`; declare it here. Comma-separated,
// e.g. "claravall.family@gmail.com".
interface Env {
  SUPER_ADMIN_EMAILS: string;
}
