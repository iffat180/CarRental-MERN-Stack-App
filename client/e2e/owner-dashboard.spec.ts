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

test.describe("owner dashboard live updates", () => {
  test("a pushed booking shows a toast and refreshes the dashboard", async ({ page }) => {
    await loginAsOwner(page);

    // count dashboard requests (this route wins over the one in loginAsOwner)
    let dashboardRequests = 0;
    const dashboard = {
      success: true,
      dashboardData: {
        totalCars: 1,
        totalBookings: 0,
        pendingBookings: 0,
        completedBookings: 0,
        recentBookings: [],
        monthlyRevenue: 0,
        revenueByMonth: [],
      },
    };
    await page.route("**/api/owner/dashboard", (r) => {
      dashboardRequests++;
      return r.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(dashboard),
      });
    });

    // stand in for the server's WebSocket: accept the auth message, then wait
    let push: (event: object) => void = () => {};
    let authMessage = "";
    await page.routeWebSocket(/\/ws$/, (ws) => {
      push = (event) => ws.send(JSON.stringify(event));
      ws.onMessage((message) => {
        authMessage = String(message);
        ws.send(JSON.stringify({ type: "ready" }));
      });
    });

    await page.goto("/owner");
    await expect(page.getByRole("heading", { name: "Admin Dashboard" })).toBeVisible();
    await expect.poll(() => dashboardRequests).toBe(2); // first load + catch-up refresh on "ready"
    expect(JSON.parse(authMessage)).toMatchObject({ type: "auth" });

    push({ type: "booking.created", bookingId: "b9" });
    await expect(page.getByText("New booking received")).toBeVisible();
    await expect.poll(() => dashboardRequests).toBe(3);
  });
});
