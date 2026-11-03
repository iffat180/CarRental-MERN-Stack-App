import React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

const meta = {
  title: "Foundations/Design tokens",
  parameters: { layout: "fullscreen" },
} satisfies Meta;
export default meta;

const colors = [
  ["ink", "--color-ink", "Text, buttons, borders"],
  ["ink-soft", "--color-ink-soft", "Hover state of ink"],
  ["muted", "--color-muted", "Secondary text"],
  ["subtle", "--color-subtle", "Placeholders"],
  ["accent", "--color-accent", "The one red dot"],
  ["danger", "--color-danger", "Error text"],
  ["silver-50", "--color-silver-50", "Page background (light end)"],
  ["silver-100", "--color-silver-100", ""],
  ["silver-200", "--color-silver-200", ""],
  ["silver-300", "--color-silver-300", ""],
  ["silver-400", "--color-silver-400", ""],
  ["silver-500", "--color-silver-500", "Page background (dark end)"],
] as const;

export const Colors: StoryObj = {
  render: () => (
    <div
      style={{
        padding: 24,
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))",
        gap: 16,
      }}
    >
      {colors.map(([name, variable, use]) => (
        <div key={name} className="a4-glass" style={{ borderRadius: 16, padding: 12 }}>
          <div
            style={{
              height: 64,
              borderRadius: 10,
              background: `var(${variable})`,
              border: "1px solid rgba(20,24,28,.15)",
            }}
          />
          <p className="mono" style={{ margin: "10px 0 0", fontSize: 13 }}>
            {name}
          </p>
          <p className="mono a4-muted" style={{ margin: 0, fontSize: 11 }}>
            {variable}
          </p>
          {use && <p style={{ margin: "4px 0 0", fontSize: 13 }}>{use}</p>}
        </div>
      ))}
    </div>
  ),
};

export const Typography: StoryObj = {
  render: () => (
    <div style={{ padding: 24, display: "grid", gap: 20, maxWidth: 760 }}>
      <div>
        <p className="mono a4-eyebrow">Display, Michroma</p>
        <p className="disp" style={{ fontSize: 44, margin: 0 }}>
          Every trip has its car.
        </p>
      </div>
      <div>
        <p className="mono a4-eyebrow">Body, Instrument Sans</p>
        <p style={{ fontSize: 18, margin: 0 }}>
          Slide through the cars near you and pick your dates. Or describe the trip, and we'll match
          one.
        </p>
      </div>
      <div>
        <p className="mono a4-eyebrow">Data, JetBrains Mono</p>
        <p className="mono" style={{ fontSize: 15, margin: 0 }}>
          5 seats · 29 mpg · 850 L
        </p>
      </div>
    </div>
  ),
};

export const Surfaces: StoryObj = {
  render: () => (
    <div style={{ padding: 24, display: "flex", gap: 20, flexWrap: "wrap" }}>
      <div className="a4-glass" style={{ borderRadius: 24, padding: 24, width: 260 }}>
        <p className="mono a4-eyebrow">.a4-glass</p>
        <p style={{ margin: "8px 0 0" }}>Frosted card used for the booking console and panels.</p>
      </div>
      <button className="a4-primary" style={{ borderRadius: 14, padding: "0 28px", minHeight: 54 }}>
        .a4-primary
      </button>
    </div>
  ),
};
