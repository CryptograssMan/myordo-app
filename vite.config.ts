import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { cloudflare } from "@cloudflare/vite-plugin";
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    cloudflare(),
    // PWA (offline-pwa spec §4/§5). registerType 'prompt' — never
    // auto-reload out from under a mid-edit homily draft; the update
    // toast in src/pwa.ts asks first.
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'brand/*.svg'],
      manifest: {
        name: 'myORDO',
        short_name: 'myORDO',
        description: 'The liturgical calendar, personalized for your parish.',
        lang: 'en', // the UI itself is bilingual per-user
        display: 'standalone',
        start_url: '/?source=pwa',
        scope: '/',
        theme_color: '#F1ECE0',
        background_color: '#F1ECE0',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: '/icons/icon-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Precache the whole app shell — the app must boot with zero
        // network (romcal is client-side; its locale data ships in the
        // JS bundle and is precached with it).
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        // SPA routing offline…
        navigateFallback: '/index.html',
        // …but NEVER intercept the Worker routes: /api/* is data (flows
        // through IndexedDB, an SW cache would be a second stale source
        // of truth — spec §5) and /auth/* is the OAuth redirect dance.
        navigateFallbackDenylist: [/^\/api\//, /^\/auth\//],
        // No runtimeCaching entries: anything not precached goes straight
        // to the network, so /api and /auth responses are never cached.
      },
    }),
  ],
})
