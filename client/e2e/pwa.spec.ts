import { test, expect } from "@playwright/test";

// These run against the build served by lighthouse/serve.mjs, with the real service worker.

test("the site is installable: manifest, icons and the apple touch icon", async ({
  page,
  request,
}) => {
  await page.goto("/");
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute(
    "href",
    "/manifest.webmanifest"
  );
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveCount(1);

  const manifest = await (await request.get("/manifest.webmanifest")).json();
  expect(manifest).toMatchObject({
    name: "Wayfarer",
    short_name: "Wayfarer",
    display: "standalone",
    start_url: "/",
  });
  const sizes = manifest.icons.map((i: any) => `${i.sizes}${i.purpose ? `:${i.purpose}` : ""}`);
  expect(sizes).toEqual(expect.arrayContaining(["192x192", "512x512", "512x512:maskable"]));

  // every listed icon really exists
  for (const icon of manifest.icons) {
    const res = await request.get(icon.src);
    expect(res.status(), icon.src).toBe(200);
    expect(res.headers()["content-type"]).toContain("image/png");
  }
});

test("a service worker takes over after the first visit (allowed by the security policy)", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  expect(await page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
});

test("offline, the site still opens and shows the cars it last loaded", async ({
  page,
  context,
}) => {
  // visit once so the app and the cars list are stored, then reload so the service worker is in charge
  await page.goto("/");
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await expect(page.getByRole("heading", { name: "Subaru Outback", level: 2 })).toBeVisible();
  await expect
    .poll(() => page.evaluate(async () => (await caches.keys()).includes("api-cars")))
    .toBe(true);
  await page.waitForLoadState("networkidle");

  await context.setOffline(true);
  await page.reload();

  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Every trip has its car.");
  await expect(page.getByRole("heading", { name: "Subaru Outback", level: 2 })).toBeVisible();
  await expect(page.getByRole("status").filter({ hasText: "You're offline" })).toBeVisible();

  // moving around inside the app still works offline, with the stored cars
  await page.getByRole("link", { name: "Cars", exact: true }).first().click();
  await expect(page.getByRole("heading", { name: "Available Cars" })).toBeVisible();
  await expect(page.locator("main a[href^='/car-details/']").first()).toBeVisible();

  // and the banner goes away when the connection comes back
  await context.setOffline(false);
  await expect(page.getByRole("status").filter({ hasText: "You're offline" })).toBeHidden();
});

test("account and booking calls are never stored by the service worker", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await page.waitForLoadState("networkidle");

  const stored = await page.evaluate(async () => {
    const urls: string[] = [];
    for (const name of await caches.keys()) {
      for (const req of await (await caches.open(name)).keys())
        urls.push(new URL(req.url).pathname);
    }
    return urls;
  });
  expect(stored.filter((p) => p.startsWith("/api/"))).toEqual(
    expect.arrayContaining(["/api/user/cars"])
  );
  expect(stored.some((p) => /\/api\/(bookings|owner)/.test(p) || p === "/api/user/data")).toBe(
    false
  );
});
