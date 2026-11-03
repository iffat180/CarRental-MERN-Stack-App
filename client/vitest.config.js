import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // the service-worker module only exists in a real build
      "virtual:pwa-register/react": fileURLToPath(
        new URL("./src/test/pwaRegisterStub.ts", import.meta.url)
      ),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/setupTests.ts"],
    exclude: ["node_modules/**", "dist/**", "e2e/**", "storybook-tests/**", "storybook-static/**"],
    include: ["**/__tests__/**/*.test.{js,jsx,ts,tsx}", "**/?(*.)+(spec|test).{js,jsx,ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "src/setupTests.ts",
        "**/*.config.{js,ts}",
        "**/main.tsx",
        "**/App.tsx",
      ],
    },
  },
});
