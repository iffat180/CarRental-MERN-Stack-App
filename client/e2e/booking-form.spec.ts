import type { Page } from "@playwright/test";
import { test, expect, loginAsUser } from "./fixtures";

const openForm = async (page: Page) => {
  await loginAsUser(page);
  await page.goto("/booking-details/car17?pickupDate=2030-02-01&returnDate=2030-02-04");
  await expect(page.getByRole("heading", { name: "Booking Details" })).toBeVisible();
};

const fillValidForm = async (page: Page) => {
  await page.getByLabel(/^Phone Number/).fill("+1 555 0100");
  await page.getByLabel(/^Date of Birth/).fill("1990-05-01");
  await page.getByLabel(/^Nationality/).fill("British");
  await page.getByLabel(/^License Number/).fill("LOVEL-12345");
  await page.getByLabel(/^License Expiry Date/).fill("2035-01-01");
  await page.getByLabel(/^Country of Issue/).fill("UK");
  await page.getByLabel(/^Pickup Location/).selectOption({ index: 1 });
  await page.getByLabel(/^Pickup Time/).selectOption("10:00");
  await page.getByLabel(/^Return Location/).selectOption({ index: 1 });
  await page.getByLabel(/^Return Time/).selectOption("18:30");
};

test.describe("booking details form", () => {
  test("prefills the name and email from the account, and locks the email", async ({ page }) => {
    await openForm(page);
    await expect(page.getByLabel(/^Full Name/)).toHaveValue("Test User");
    await expect(page.getByLabel(/^Email/)).toHaveValue("test@example.com");
    await expect(page.getByLabel(/^Email/)).toHaveAttribute("readonly", "");
  });

  test("shows an error for every missing field and clears one as it is fixed", async ({ page }) => {
    await openForm(page);
    await page.getByRole("button", { name: "Continue to Summary" }).click();

    for (const message of [
      "Phone number is required",
      "Date of birth is required",
      "Nationality is required",
      "License number is required",
      "License expiry date is required",
      "License country is required",
      "Pickup address is required",
      "Pickup time is required",
      "Return address is required",
      "Return time is required",
    ]) {
      await expect(page.getByText(message)).toBeVisible();
    }
    await expect(page.getByLabel(/^Phone Number/)).toHaveAttribute("aria-invalid", "true");

    await page.getByLabel(/^Phone Number/).fill("+1 555 0100");
    await expect(page.getByText("Phone number is required")).toBeHidden();
    await expect(page.getByLabel(/^Phone Number/)).toHaveAttribute("aria-invalid", "false");
    await expect(page.getByText("Nationality is required")).toBeVisible(); // the others stay
  });

  test("rejects a date of birth in the future and an expired license", async ({ page }) => {
    await openForm(page);
    await page.getByLabel(/^Date of Birth/).fill("2999-01-01");
    await page.getByLabel(/^License Expiry Date/).fill("2001-01-01");
    await page.getByRole("button", { name: "Continue to Summary" }).click();

    await expect(page.getByText("Date of birth must be in the past")).toBeVisible();
    await expect(page.getByText("License expiry date must be in the future")).toBeVisible();
  });

  test("submits the typed values and goes to the summary", async ({ page }) => {
    let body: any;
    await page.route("**/api/bookings/create-details", (route) => {
      body = route.request().postDataJSON();
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, bookingId: "b123" }),
      });
    });
    await openForm(page);
    await fillValidForm(page);
    await page.getByLabel("Extra Driver").check();
    await page.getByPlaceholder("Any additional notes or special requests...").fill("Child seat");
    await page.getByRole("button", { name: "Continue to Summary" }).click();

    await expect(page).toHaveURL(/\/booking-summary\/b123$/);
    expect(body).toMatchObject({
      car: "car17",
      pickupDate: "2030-02-01",
      returnDate: "2030-02-04",
      userDetails: {
        fullName: "Test User",
        email: "test@example.com", // sent even though the field is read-only
        phone: "+1 555 0100",
        nationality: "British",
        licenseCountry: "UK",
      },
      pickupDetails: { time: "10:00" },
      returnDetails: { time: "18:30" },
      extras: { extraDriver: true },
      notes: "Child seat",
    });
  });

  test("shows the server's field errors next to the fields", async ({ page }) => {
    await page.route("**/api/bookings/create-details", (route) =>
      route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({
          success: false,
          message: "Validation failed",
          errors: [{ path: "userDetails.phone", msg: "Phone number looks invalid" }],
        }),
      })
    );
    await openForm(page);
    await fillValidForm(page);
    await page.getByRole("button", { name: "Continue to Summary" }).click();

    await expect(page.getByText("Phone number looks invalid")).toBeVisible();
    await expect(page).toHaveURL(/\/booking-details\/car17/);
  });
});
