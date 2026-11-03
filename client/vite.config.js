import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // Makes the site installable and lets it open (and show the cars it last loaded) with
    // no connection. The service worker is generated at build time and only runs in the
    // production build, not in `npm run dev`.
    VitePWA({
      // "prompt": a new version waits until the visitor presses Reload (see PwaPrompt),
      // so the page never changes under someone who is in the middle of a booking.
      registerType: "prompt",
      includeAssets: ["favicon.svg", "icons/apple-touch-icon.png"],
      manifest: {
        name: "Wayfarer",
        short_name: "Wayfarer",
        description: "Rent a car directly from its owner.",
        theme_color: "#d6dadf",
        background_color: "#eef0f2",
        display: "standalone",
        start_url: "/",
        scope: "/",
        categories: ["travel", "lifestyle"],
        icons: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
          {
            src: "/icons/icon-maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        // The app itself (code, styles, fonts) is stored on first visit. The owner dashboard
        // chunk (the chart library) is left out: owners need a connection anyway.
        globPatterns: ["**/*.{js,css,html,svg,woff2}"],
        globIgnores: ["**/Dashboard-*.js"],
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/api\//, /^\/robots\.txt$/, /^\/sitemap\.xml$/],
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            // The cars and cities lists: fresh when online, the last copy when offline.
            // Nothing else from the API is stored (bookings and accounts always need the network).
            urlPattern: ({ url }) =>
              url.pathname === "/api/user/cars" || url.pathname === "/api/user/cities",
            handler: "NetworkFirst",
            options: {
              cacheName: "api-cars",
              networkTimeoutSeconds: 3,
              expiration: { maxEntries: 5, maxAgeSeconds: 7 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [200] },
            },
          },
          {
            // Our own car photos and cut-outs: show the stored copy at once, refresh in the background
            urlPattern: ({ url }) =>
              url.pathname.startsWith("/cars/") || url.pathname.startsWith("/cutouts/"),
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "car-images",
              expiration: { maxEntries: 80, maxAgeSeconds: 30 * 24 * 60 * 60 },
            },
          },
          {
            // Photos owners upload live on the CDN
            urlPattern: ({ url, request }) =>
              request.destination === "image" && url.hostname.endsWith("cloudfront.net"),
            handler: "CacheFirst",
            options: {
              cacheName: "cdn-images",
              expiration: { maxEntries: 60, maxAgeSeconds: 30 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
});
