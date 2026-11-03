import AxeBuilder from "@axe-core/playwright";
import { test, expect, loginAsOwner } from "./fixtures";

test.describe("owner dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsOwner(page);
    await page.goto("/owner");
  });

  test("shows the stat cards and the revenue chart", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Admin Dashboard" })).toBeVisible();
    await expect(page.getByText("Total Cars", { exact: true })).toBeVisible();
    await expect(page.getByText("Completed", { exact: true })).toBeVisible();

    await expect(page.getByRole("heading", { name: "Revenue by month" })).toBeVisible();
    await expect(page.getByTestId("revenue-chart").locator("svg").first()).toBeVisible();
    // one bar per month that has revenue (two of the six months are empty)
    await expect(page.getByTestId("revenue-chart").locator(".recharts-bar-rectangle")).toHaveCount(
      4
    );
  });

  test("gives screen readers the revenue numbers as a table", async ({ page }) => {
    const table = page.getByRole("table", { name: "Revenue by month" });
    await expect(table.getByRole("row")).toHaveCount(7); // header + 6 months
    await expect(table).toContainText("$500");
  });

  test("has no serious accessibility violations", async ({ page }) => {
    await expect(page.getByTestId("revenue-chart")).toBeVisible();
    const { violations } = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    const serious = violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(
      serious,
      serious.map((v) => `${v.id}: ${v.help} (${v.nodes.length})`).join("\n")
    ).toEqual([]);
  });
});
