import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(ts|tsx)"],
  addons: ["@storybook/addon-a11y"],
  framework: "@storybook/react-vite",
  core: { disableTelemetry: true },
  // the car photos and cut-outs are served from /public
  staticDirs: ["../public"],
  // The site's service worker plugin must not run inside Storybook
  viteFinal: (config) => ({
    ...config,
    plugins: (config.plugins ?? [])
      .flat(Infinity)
      .filter(
        (plugin) =>
          !(plugin && "name" in plugin && String(plugin.name).startsWith("vite-plugin-pwa"))
      ),
  }),
};

export default config;
