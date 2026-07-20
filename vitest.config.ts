import { cloudflareTest } from "@cloudflare/vitest-pool-workers";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      {
        // Worker/D1 tests — run inside the real workerd runtime with
        // bindings. Anything under worker/ that needs env.DB, TenantDB, etc.
        plugins: [
          cloudflareTest({
            wrangler: { configPath: "./wrangler.jsonc" },
          }),
        ],
        test: {
          name: "workers",
          include: ["worker/**/*.{test,spec}.ts"],
        },
      },
      {
        // Pure logic tests — plain Node environment. romcal is hybrid
        // CJS/ESM client-side code with no Worker bindings; running it in
        // the workers pool is both unnecessary and a known source of
        // CJS/ESM require errors. Node is the correct, honest environment.
        test: {
          name: "node",
          environment: "node",
          include: ["src/**/*.{test,spec}.ts"],
        },
      },
    ],
  },
});
