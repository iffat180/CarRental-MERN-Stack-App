import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { test, expect, loginAsUser } from "./fixtures";

// each car card on the Cars page is a link to /car-details/<id>
const cards = (page: Page) => page.locator("main a[href^='/car-details/']");

test.describe("cars page", () => {
  test("lists the cars and filters by the search box", async ({ page }) => {
    await page.goto("/cars");
    await expect(cards(page)).toHaveCount(7);

    await page.getByLabel("Search cars by make, model or features").first().fill("Outback");
    await expect(cards(page)).toHaveCount(1);
    await expect(page.getByRole("heading", { name: "Subaru Outback" })).toBeVisible();
  });

  test("opens a car's page from its card", async ({ page }) => {
    await page.goto("/cars");
    await cards(page).first().click();
    await expect(page).toHaveURL(/\/car-details\//);
  });
});

test.describe("booking", () => {
  test("a logged-out visitor is asked to log in before booking", async ({ page }) => {
    await page.goto("/car-details/car17");
    await page.getByLabel(/Pickup Date/).fill("2030-02-01");
    await page.getByLabel(/Return Date/).fill("2030-02-04");
    await page.getByRole("button", { name: "Book Now" }).click();

    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Login Required" })).toBeVisible();
  });

  test("the login dialog traps focus, closes on Escape and gives focus back", async ({ page }) => {
    await page.goto("/car-details/car17");
    await page.getByLabel(/Pickup Date/).fill("2030-02-01");
    await page.getByLabel(/Return Date/).fill("2030-02-04");
    const bookNow = page.getByRole("button", { name: "Book Now" });
    await bookNow.click();

    const dialog = page.getByRole("dialog", { name: "Login Required" });
    await expect(dialog).toBeVisible();

    // Tab many times: focus must never leave the dialog
    for (let i = 0; i < 8; i++) {
      await page.keyboard.press("Tab");
      const inside = await page.evaluate(
        () => !!document.activeElement?.closest('[role="dialog"]')
      );
      expect(inside).toBe(true);
    }

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(bookNow).toBeFocused();
  });

  test("the login dialog has no serious accessibility violations", async ({ page }) => {
    await page.goto("/car-details/car17");
    await page.getByLabel(/Pickup Date/).fill("2030-02-01");
    await page.getByLabel(/Return Date/).fill("2030-02-04");
    await page.getByRole("button", { name: "Book Now" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();

    const { violations } = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    const serious = violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(serious, serious.map((v) => `${v.id}: ${v.help}`).join("\n")).toEqual([]);
  });

  test("a logged-in user reaches the booking form and sees validation errors", async ({ page }) => {
    await loginAsUser(page);
    await page.goto("/car-details/car17");
    await page.getByLabel(/Pickup Date/).fill("2030-02-01");
    await page.getByLabel(/Return Date/).fill("2030-02-04");
    await page.getByRole("button", { name: "Book Now" }).click();

    await expect(page).toHaveURL(/\/booking-details\/car17/);
    await expect(page.getByRole("heading", { name: "Booking Details" })).toBeVisible();

    await page.getByRole("button", { name: "Continue to Summary" }).click();
    await expect(page.getByText("Phone number is required")).toBeVisible();
    await expect(page.getByText("License number is required")).toBeVisible();
  });
});
