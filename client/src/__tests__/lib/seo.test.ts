import { describe, it, expect } from "vitest";
import { snippet, SITE_URL } from "../../lib/seo";

describe("snippet", () => {
  it("leaves short text alone and collapses whitespace", () => {
    expect(snippet("  A   short\n text ")).toBe("A short text");
  });

  it("cuts long text at a word boundary and adds an ellipsis", () => {
    const text = "word ".repeat(80);
    const out = snippet(text, 50);
    expect(out.length).toBeLessThanOrEqual(51);
    expect(out.endsWith("…")).toBe(true);
    expect(out).not.toMatch(/wor…$/); // never mid-word
  });

  it("keeps text exactly at the limit", () => {
    expect(snippet("x".repeat(155))).toBe("x".repeat(155));
  });
});

describe("SITE_URL", () => {
  it("has no trailing slash", () => {
    expect(SITE_URL.endsWith("/")).toBe(false);
    expect(SITE_URL.startsWith("https://")).toBe(true);
  });
});
