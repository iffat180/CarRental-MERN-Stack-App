import React from "react";
import type { Preview } from "@storybook/react-vite";
import { MemoryRouter } from "react-router-dom";
import "../src/index.css";
import "../src/components/a4/a4.css";
import "../src/components/a4/a4-skin.css";

const preview: Preview = {
  parameters: {
    layout: "padded",
    controls: { expanded: true },
    a11y: { test: "error" },
  },
  decorators: [
    // every story runs inside the .a4 wrapper (that is where the theme lives) and a router
    (Story) => (
      <MemoryRouter>
        <div className="a4" style={{ minHeight: "auto", padding: 24, borderRadius: 12 }}>
          <Story />
        </div>
      </MemoryRouter>
    ),
  ],
};

export default preview;
