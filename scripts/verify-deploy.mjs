// scripts/verify-deploy.mjs
//
// Confirms the client bundle actually LIVE in production is the one we
// just built. Runs automatically after `npm run deploy`.
//
// Why this exists: `wrangler deploy` prints "Uploaded" whether or not the
// contents changed, and a stale `dist/` will happily redeploy old code
// with a successful-looking summary. We burned two deploys debugging code
// that was never running. The bundle filename is content-hashed, so
// comparing local to live is a complete check.
//
// Exits non-zero on mismatch so CI or a shell chain fails loudly.

import { readdirSync } from "node:fs";

const BASE = process.env.APP_BASE_URL ?? "https://myordo.cenaclelabs.com";
const ASSETS = "dist/client/assets";

function localBundle() {
  const files = readdirSync(ASSETS).filter(
    (f) => f.startsWith("index-") && f.endsWith(".js"),
  );
  if (files.length !== 1) {
    throw new Error(
      `Expected exactly one index-*.js in ${ASSETS}, found ${files.length}. ` +
        `Stale build output? Try: npm run clean && npm run build`,
    );
  }
  return files[0];
}

async function liveBundle() {
  let res;
  try {
    res = await fetch(BASE, { cache: "no-store" });
  } catch (err) {
    throw new Error(
      `Could not reach ${BASE} (${err.cause?.code ?? err.message}). ` +
        `Deploy may have succeeded — verify manually.`,
    );
  }
  if (!res.ok) throw new Error(`GET ${BASE} -> HTTP ${res.status}`);
  const html = await res.text();
  const match = html.match(/index-[A-Za-z0-9_-]+\.js/);
  if (!match) {
    throw new Error(
      `No index-*.js found in the HTML at ${BASE}. Did the deploy serve the SPA shell?`,
    );
  }
  return match[0];
}

let local;
try {
  local = localBundle();
} catch (err) {
  console.error(`\n❌ ${err.message}\n`);
  process.exit(1);
}

// Cloudflare's edge can take a moment to serve the new asset.
for (let attempt = 1; attempt <= 5; attempt++) {
  let live;
  try {
    live = await liveBundle();
  } catch (err) {
    console.error(`\n❌ ${err.message}\n`);
    process.exit(1);
  }
  if (live === local) {
    console.log(`✅ Deploy verified — live bundle is ${live}`);
    process.exit(0);
  }
  if (attempt < 5) {
    console.log(`… live is ${live}, expected ${local}. Retrying in 3s (${attempt}/5)`);
    await new Promise((r) => setTimeout(r, 3000));
  } else {
    console.error(
      `\n❌ DEPLOY MISMATCH\n` +
        `   built: ${local}\n` +
        `   live:  ${live}\n\n` +
        `   The deployed client is NOT what you just built. Do not test\n` +
        `   against it — you would be debugging old code.\n\n` +
        `   Fix: npm run clean && npm run build && npm run deploy\n`,
    );
    process.exit(1);
  }
}
