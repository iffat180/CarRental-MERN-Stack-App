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

  test("swiping the slider sideways changes the car", async ({ page }) => {
    await page.goto("/");
    const stage = page.locator("#cars");
    const box = (await stage.boundingBox())!;
    const y = box.y + box.height * 0.35;

    // drag left by a good distance: next car
    await page.mouse.move(box.x + box.width * 0.7, y);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.3, y, { steps: 12 });
    await page.mouse.up();
    await expect(page.getByRole("heading", { name: "Mazda MX-5 Miata", level: 2 })).toBeVisible();

    // drag right: back to the first
    await page.mouse.move(box.x + box.width * 0.3, y);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.7, y, { steps: 12 });
    await page.mouse.up();
    await expect(page.getByRole("heading", { name: "Subaru Outback", level: 2 })).toBeVisible();
  });

  test("a short drag springs back and keeps the same car", async ({ page }) => {
    await page.goto("/");
    const box = (await page.locator("#cars").boundingBox())!;
    const y = box.y + box.height * 0.35;

    await page.mouse.move(box.x + box.width * 0.5, y);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.5 - 20, y, { steps: 4 });
    await page.waitForTimeout(250); // hold still: a quick flick counts as a swipe, a slow nudge does not
    await page.mouse.up();

    await expect(page.getByRole("heading", { name: "Subaru Outback", level: 2 })).toBeVisible();
  });

  test("arrow keys change the car while focus is in the slider", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Next car" }).focus();
    await page.keyboard.press("ArrowRight");
    await expect(page.getByRole("heading", { name: "Mazda MX-5 Miata", level: 2 })).toBeVisible();
    await page.keyboard.press("ArrowLeft");
    await expect(page.getByRole("heading", { name: "Subaru Outback", level: 2 })).toBeVisible();
  });

  test("with reduced motion the slider still works, and jumps without animating", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const track = page.locator(".a4-track");
    const before = await track.evaluate((el) => getComputedStyle(el).transform);

    await page.getByRole("button", { name: "Next car" }).click();
    await expect(page.getByRole("heading", { name: "Mazda MX-5 Miata", level: 2 })).toBeVisible();
    // no spring: the row is already at its new position
    const after = await track.evaluate((el) => getComputedStyle(el).transform);
    expect(after).not.toBe(before);
    await page.waitForTimeout(50);
    expect(await track.evaluate((el) => getComputedStyle(el).transform)).toBe(after);
  });

  test("pages fade in when you navigate", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Cars", exact: true }).first().click();
    await expect(page).toHaveURL(/\/cars$/);
    await expect(page.getByRole("heading", { name: "Available Cars" })).toBeVisible();
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
