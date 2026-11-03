import { test, expect, CARS } from "./fixtures";

test.describe("when a page crashes", () => {
  test("shows a friendly message, keeps the header, and recovers on navigation", async ({
    page,
  }) => {
    // tags as text instead of a list: the car page cannot render this
    const broken = CARS.map((c) => (c._id === "car17" ? { ...c, tags: "not-a-list" } : c));
    await page.route("**/api/user/cars", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, cars: broken }),
      })
    );
    page.on("console", () => {}); // React logs the caught error; nothing to assert on it

    await page.goto("/car-details/car17");

    await expect(page.getByRole("heading", { name: "Something went wrong" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Reload the page" })).toBeVisible();
    // the rest of the site still works
    await expect(page.getByRole("navigation", { name: "Main" })).toBeVisible();

    await page.getByRole("link", { name: "Cars", exact: true }).first().click();
    await expect(page.getByRole("heading", { name: "Available Cars" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Something went wrong" })).toBeHidden();
  });
});
