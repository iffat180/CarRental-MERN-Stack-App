import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end tests run against a production build.
 *
 * Most tests use `vite preview` (port 4173) with the API mocked inside each test (see
 * e2e/fixtures.ts), so they need no database or backend and never touch real data. The
 * service worker is blocked there, because it would answer requests before the test's
 * mocks could.
 *
 * The "pwa" project is the exception: it needs the real service worker, so it runs
 * against lighthouse/serve.mjs (port 4174), a small server that serves the same build
 * with the real security headers and its own mock API.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: "http://localhost:4173",
    trace: "retain-on-failure",
    serviceWorkers: "block",
  },
  projects: [
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
      testIgnore: /(mobile|pwa)\.spec\.ts/,
    },
    { name: "mobile", use: { ...devices["Pixel 7"] }, testMatch: /mobile\.spec\.ts/ },
    {
      name: "pwa",
      use: {
        ...devices["Desktop Chrome"],
        baseURL: "http://localhost:4174",
        serviceWorkers: "allow",
      },
      testMatch: /pwa\.spec\.ts/,
    },
  ],
  webServer: [
    {
      // an empty API address makes the app call its own server, which both servers handle
      command: "VITE_BASE_URL= npm run build && npm run preview -- --port 4173 --strictPort",
      url: "http://localhost:4173",
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: "node lighthouse/serve.mjs",
      url: "http://localhost:4174",
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
  ],
});
