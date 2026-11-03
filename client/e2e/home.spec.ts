import { test, expect } from "./fixtures";

test.describe("home page", () => {
  test("shows the headline and the first car from the API", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Every trip has its car.");
    await expect(page.getByRole("heading", { name: "Subaru Outback", level: 2 })).toBeVisible();
    await expect(page.locator(".a4-sel .price")).toContainText("$95");
  });

  test("the slider moves to the next car and the card follows", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Next car" }).click();
    await expect(page.getByRole("heading", { name: "Mazda MX-5 Miata", level: 2 })).toBeVisible();
    await page.getByRole("button", { name: "Previous car" }).click();
    await expect(page.getByRole("heading", { name: "Subaru Outback", level: 2 })).toBeVisible();
  });

  test("Check availability opens the chosen car with the dates filled in", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Next car" }).click();
    await page.getByLabel("Pick-up date").fill("2030-01-10");
    await page.getByLabel("Return date").fill("2030-01-13");
    await page.getByRole("button", { name: "Check availability" }).click();

    await expect(page).toHaveURL(/\/car-details\/car14$/);
    // level 1: while the page changes the old home page can still be on screen for a moment
    await expect(page.getByRole("heading", { level: 1, name: /Mazda MX-5 Miata/ })).toBeVisible();
    await expect(page.getByLabel(/Pickup Date/)).toHaveValue("2030-01-10");
    await expect(page.getByLabel(/Return Date/)).toHaveValue("2030-01-13");
  });

  test("rejects a return date before the pick-up date", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("Pick-up date").fill("2030-01-10");
    await page.getByLabel("Return date").fill("2030-01-09");
    await page.getByRole("button", { name: "Check availability" }).click();
    await expect(page.getByRole("alert")).toContainText("Return date must be after");
    await expect(page).toHaveURL("/");
  });

  test("Describe the trip shows ranked matches from the AI search", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Describe the trip" }).click();
    await page.getByRole("button", { name: "Match my car" }).click();

    const results = page.getByRole("list").filter({ hasText: "Test reason 1" });
    await expect(results.getByRole("listitem")).toHaveCount(3);
    await expect(results).toContainText("Subaru Outback");
    await results.getByRole("link").first().click();
    await expect(page).toHaveURL(/\/car-details\/car17$/);
  });

  test("featured cars link to their detail page", async ({ page }) => {
    await page.goto("/");
    const featured = page.locator("#featured");
    await expect(featured.getByRole("link")).toHaveCount(6);
    await featured.getByRole("link").first().click();
    await expect(page).toHaveURL(/\/car-details\//);
  });
});
