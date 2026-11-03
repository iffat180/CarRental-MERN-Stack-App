import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { test, expect, loginAsOwner } from "./fixtures";

const REPLY = {
  success: true,
  reply: "The 2023 Subaru Outback in Denver fits well, at $95 a day.",
  toolsUsed: ["search_cars"],
  cars: [{ id: "car17", name: "2023 Subaru Outback", city: "Denver", price_per_day_usd: 95 }],
};

const mockAssistant = (page: Page, body: unknown = REPLY, status = 200) =>
  page.route("**/api/assistant", (route) =>
    route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) })
  );

// the chat is fetched when the browser is idle, so wait for its button
const openChat = async (page: Page) => {
  const button = page.getByRole("button", { name: "Ask Wayfarer" });
  await expect(button).toBeVisible({ timeout: 10_000 });
  await button.click();
  await expect(page.getByRole("dialog", { name: "Ask Wayfarer" })).toBeVisible();
};

test.describe("assistant chat", () => {
  test("a suggestion gets an answer with a car card that opens the car", async ({ page }) => {
    await mockAssistant(page);
    await page.goto("/");
    await openChat(page);

    await page.getByRole("button", { name: "A car for 4 people and skis" }).click();
    await expect(page.getByText("fits well, at $95 a day")).toBeVisible();

    // scoped to the chat: the home page lists the same car in its featured cars
    const card = page.locator(".a4-chat").getByRole("link", { name: /2023 Subaru Outback/ });
    await expect(card).toContainText("Denver · $95 / day");
    await card.click();

    await expect(page).toHaveURL(/\/car-details\/car17$/);
    await expect(page.getByRole("dialog", { name: "Ask Wayfarer" })).toBeHidden();
  });

  test("sends the conversation so far, without any system message", async ({ page }) => {
    let body: any;
    await page.route("**/api/assistant", (route) => {
      body = route.request().postDataJSON();
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(REPLY),
      });
    });
    await page.goto("/");
    await openChat(page);

    await page.getByLabel("Your message").fill("something for a weekend");
    await page.keyboard.press("Enter");
    await expect(page.getByText("fits well")).toBeVisible();

    await page.getByLabel("Your message").fill("and for a week?");
    await page.keyboard.press("Enter");
    await expect.poll(() => body?.messages?.length).toBe(3);
    expect(body.messages.map((m: any) => m.role)).toEqual(["user", "assistant", "user"]);
  });

  test("shows a plain message when the assistant is unavailable", async ({ page }) => {
    await mockAssistant(page, { success: false, error: "not available" }, 503);
    await page.goto("/");
    await openChat(page);
    await page.getByLabel("Your message").fill("hello");
    await page.keyboard.press("Enter");
    await expect(page.getByText(/isn't available right now/)).toBeVisible();
  });

  test("opens and closes from the keyboard, and focus goes back to the button", async ({
    page,
  }) => {
    await page.goto("/");
    const button = page.getByRole("button", { name: "Ask Wayfarer" });
    await expect(button).toBeVisible({ timeout: 10_000 });

    await button.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByLabel("Your message")).toBeFocused();

    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toBeHidden();
    await expect(button).toBeFocused();
  });

  test("keeps the conversation after a refresh, but not in a new tab's storage", async ({
    page,
  }) => {
    await mockAssistant(page);
    await page.goto("/");
    await openChat(page);
    await page.getByLabel("Your message").fill("a car for skis");
    await page.keyboard.press("Enter");
    await expect(page.getByText("fits well")).toBeVisible();

    await page.reload();
    await openChat(page);
    await expect(page.getByText("a car for skis")).toBeVisible();
    await expect(page.getByText("fits well")).toBeVisible();

    await page.getByRole("button", { name: "New chat" }).click();
    await expect(page.getByText("fits well")).toBeHidden();
  });

  test("the page behind stays usable while the chat is open", async ({ page }) => {
    await page.goto("/");
    await openChat(page);
    await page.getByRole("button", { name: "Next car" }).click();
    await expect(page.getByRole("heading", { name: "Mazda MX-5 Miata", level: 2 })).toBeVisible();
    await expect(page.getByRole("dialog", { name: "Ask Wayfarer" })).toBeVisible();
  });

  test("the open chat has no serious accessibility violations", async ({ page }) => {
    await mockAssistant(page);
    await page.goto("/");
    await openChat(page);
    await page.getByRole("button", { name: "A convertible for a weekend" }).click();
    await expect(page.getByText("fits well")).toBeVisible();

    const { violations } = await new AxeBuilder({ page })
      .include(".a4-chat")
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    const serious = violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(
      serious,
      serious.map((v) => `${v.id}: ${v.help} (${v.nodes.length})`).join("\n")
    ).toEqual([]);
  });

  test("is not shown in the owner area", async ({ page }) => {
    await loginAsOwner(page);
    await page.goto("/owner");
    await expect(page.getByRole("heading", { name: "Admin Dashboard" })).toBeVisible();
    await page.waitForTimeout(2500); // longer than the chat's idle delay
    await expect(page.getByRole("button", { name: "Ask Wayfarer" })).toHaveCount(0);
  });
});
