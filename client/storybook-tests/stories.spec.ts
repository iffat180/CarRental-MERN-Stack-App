import fs from "node:fs";
import AxeBuilder from "@axe-core/playwright";
import { test, expect } from "@playwright/test";

// The list of stories comes from the Storybook build, so every new story is tested
// automatically.
const index = JSON.parse(fs.readFileSync("storybook-static/index.json", "utf8"));
const stories = Object.values<any>(index.entries).filter((e) => e.type === "story");

for (const story of stories) {
  test(`${story.title} / ${story.name}`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));

    await page.goto(`/iframe.html?id=${story.id}&viewMode=story`);
    await expect(page.locator("#storybook-root > *").first()).toBeVisible();
    await page.waitForLoadState("networkidle");

    expect(errors, "the story threw an error").toEqual([]);

    const { violations } = await new AxeBuilder({ page })
      .include("#storybook-root")
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    const serious = violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(
      serious,
      serious.map((v) => `${v.id}: ${v.help} (${v.nodes.length})`).join("\n")
    ).toEqual([]);
  });
}
