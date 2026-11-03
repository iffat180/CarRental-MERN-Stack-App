import AxeBuilder from "@axe-core/playwright";
import { test, expect } from "./fixtures";

// Automated WCAG 2.1 A/AA scan. It catches the machine-checkable problems
// (missing labels, bad ARIA, low contrast); it does not replace a manual audit.
const scan = (page: import("@playwright/test").Page) =>
  new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();

for (const [name, path] of [
  ["home", "/"],
  ["cars", "/cars"],
  ["car details", "/car-details/car17"],
] as const) {
  test(`${name} page has no serious accessibility violations`, async ({ page }) => {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    const { violations } = await scan(page);
    const serious = violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(
      serious,
      serious.map((v) => `${v.id}: ${v.help} (${v.nodes.length})`).join("\n")
    ).toEqual([]);
  });
}
