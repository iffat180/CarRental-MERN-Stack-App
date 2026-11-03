import type { Page } from "@playwright/test";
import { test, expect, loginAsOwner } from "./fixtures";

const meta = (page: Page, selector: string) => page.locator(`head ${selector}`);

test.describe("search and sharing tags", () => {
  test("the home page has a title, description, canonical link and social card", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page).toHaveTitle("Wayfarer: rent cars from people, not fleets");
    await expect(meta(page, 'meta[name="description"]')).toHaveAttribute(
      "content",
      /Rent a car directly/
    );
    await expect(meta(page, 'link[rel="canonical"]')).toHaveAttribute("href", /\/$/);
    await expect(meta(page, 'meta[property="og:image"]')).toHaveAttribute(
      "content",
      /og-image\.jpg$/
    );
    await expect(meta(page, 'meta[name="twitter:card"]')).toHaveAttribute(
      "content",
      "summary_large_image"
    );
  });

  test("each page gets its own title", async ({ page }) => {
    await page.goto("/cars");
    await expect(page).toHaveTitle("Cars for rent | Wayfarer");
    await expect(meta(page, 'link[rel="canonical"]')).toHaveAttribute("href", /\/cars$/);
  });

  test("a car page describes that car and adds structured data", async ({ page }) => {
    await page.goto("/car-details/car17");
    await expect(page).toHaveTitle("Subaru Outback 2023 for rent | Wayfarer");
    await expect(meta(page, 'meta[property="og:image"]')).toHaveAttribute("content", /car17\.jpg$/);

    const json = await page.locator('script[type="application/ld+json"]').textContent();
    const data = JSON.parse(json!);
    expect(data["@type"]).toBe("Car");
    expect(data.brand.name).toBe("Subaru");
    expect(data.offers).toMatchObject({ price: 95, priceCurrency: "USD" });
  });

  test("no tag is duplicated once the page has loaded", async ({ page }) => {
    await page.goto("/car-details/car17");
    await expect(page).toHaveTitle(/Subaru Outback/);
    for (const selector of [
      "title",
      'meta[name="description"]',
      'meta[property="og:title"]',
      'meta[property="og:image"]',
      'meta[name="twitter:card"]',
    ]) {
      expect(await page.locator(`head ${selector}`).count(), selector).toBe(1);
    }
  });

  test("there is exactly one title tag", async ({ page }) => {
    await page.goto("/cars");
    await expect(page).toHaveTitle("Cars for rent | Wayfarer");
    expect(await page.locator("title").count()).toBe(1);
  });

  test("account and owner pages ask not to be indexed", async ({ page }) => {
    await loginAsOwner(page);
    await page.goto("/owner");
    await expect(meta(page, 'meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    await expect(page).toHaveTitle("Owner dashboard | Wayfarer");
    expect(await page.locator('head link[rel="canonical"]').count()).toBe(0);
  });

  test("robots.txt hides private pages and points at the sitemap", async ({ request }) => {
    const robots = await (await request.get("/robots.txt")).text();
    expect(robots).toContain("Disallow: /owner");
    expect(robots).toContain("Disallow: /my-bookings");
    expect(robots).toContain("Sitemap:");
    const sitemap = await (await request.get("/sitemap.xml")).text();
    expect(sitemap).toContain("<urlset");
  });
});
