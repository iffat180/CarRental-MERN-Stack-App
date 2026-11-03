import { defineConfig, devices } from "@playwright/test";

/**
 * Opens every Storybook story in a browser and checks it renders and has no
 * serious accessibility violations. Run with `npm run e2e:stories`, which builds
 * Storybook first (the test reads the list of stories from the build).
 */
export default defineConfig({
  testDir: "./storybook-tests",
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI
    ? [["github"], ["html", { open: "never", outputFolder: "playwright-report-stories" }]]
    : "list",
  use: {
    baseURL: "http://localhost:6007",
    ...devices["Desktop Chrome"],
    viewport: { width: 1280, height: 900 },
  },
  webServer: {
    command: "npx vite preview --outDir storybook-static --port 6007 --strictPort",
    url: "http://localhost:6007",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
