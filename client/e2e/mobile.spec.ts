import { test, expect } from "./fixtures";

test("the phone header collapses into a menu button", async ({ page }) => {
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Main" });
  const menu = page.getByRole("button", { name: "Open menu" });

  await expect(nav.getByRole("link", { name: "Cars" })).toBeHidden();
  await menu.click();
  await expect(page.getByRole("button", { name: "Close menu" })).toHaveAttribute("aria-expanded", "true");
  await expect(nav.getByRole("link", { name: "Cars" })).toBeVisible();

  await nav.getByRole("link", { name: "Cars" }).click();
  await expect(page).toHaveURL(/\/cars$/);
  await expect(page.getByRole("button", { name: "Open menu" })).toBeVisible(); // closed again after navigating
});

test("the home page has no horizontal scroll on a phone", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});
