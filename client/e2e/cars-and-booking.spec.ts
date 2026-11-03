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
