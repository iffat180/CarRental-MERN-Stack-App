import { test as base, expect, type Page } from "@playwright/test";

const car = (n: number, brand: string, model: string, over: Record<string, unknown> = {}) => ({
  _id: `car${n}`,
  brand,
  model,
  image: `https://d3c38yoff69w1u.cloudfront.net/cars/car${n}.jpg`,
  year: 2023,
  category: "SUV",
  seating_capacity: 5,
  fuel_type: "Petrol",
  transmission: "Automatic",
  pricePerDay: 95,
  location: "Denver",
  description: `A ${brand} ${model} for testing.`,
  mpg: 29,
  trunk_capacity: 850,
  tags: ["Test"],
  isAvailable: true,
  ...over,
});

/** Same models the home-page slider has cut-outs for, plus a few others. */
export const CARS = [
  car(17, "Subaru", "Outback"),
  car(14, "Mazda", "MX-5 Miata", {
    category: "Convertible",
    seating_capacity: 2,
    location: "Los Angeles",
    trunk_capacity: 130,
    pricePerDay: 95,
  }),
  car(15, "Mercedes-Benz", "E-Class", {
    category: "Sedan",
    location: "New York",
    pricePerDay: 180,
  }),
  car(12, "KIA", "EV9", { seating_capacity: 7, location: "Chicago", pricePerDay: 135 }),
  car(13, "Toyota", "Prius", {
    category: "Sedan",
    location: "San Francisco",
    pricePerDay: 55,
    mpg: 54,
  }),
  car(16, "Dodge", "Grand Caravan", {
    category: "Van",
    seating_capacity: 7,
    location: "Chicago",
    pricePerDay: 85,
  }),
  car(18, "Ford", "F-150", { category: "Truck", location: "Houston", pricePerDay: 110 }),
];

const json = (body: unknown) => ({
  status: 200,
  contentType: "application/json",
  body: JSON.stringify(body),
});

/** A syntactically valid JWT that expires far in the future (the app only reads `exp`). */
const fakeToken = (role: string) => {
  const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
  return `${b64({ alg: "HS256", typ: "JWT" })}.${b64({ userId: "u1", role, exp: Math.floor(Date.now() / 1000) + 3600 })}.sig`;
};

/** Mock every API call the public pages make, and stub car photos so no network is needed. */
export const mockApi = async (page: Page) => {
  await page.route("**/api/user/cars", (r) => r.fulfill(json({ success: true, cars: CARS })));
  await page.route("**/api/user/cities", (r) =>
    r.fulfill(json({ success: true, cities: ["Chicago", "Denver", "Houston"] }))
  );
  await page.route("**/api/recommendations", (r) =>
    r.fulfill(
      json({
        success: true,
        recommendations: CARS.slice(0, 3).map((c, i) => ({
          ...c,
          car_id: c._id,
          rank: i + 1,
          score: 0.9 - i * 0.1,
          similarityScore: 0.9,
          boostScore: 0,
          reason: `Test reason ${i + 1}`,
        })),
      })
    )
  );
  // external car photos: answer with a 1x1 transparent PNG
  await page.route("https://d3c38yoff69w1u.cloudfront.net/**", (r) =>
    r.fulfill({
      status: 200,
      contentType: "image/png",
      body: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
        "base64"
      ),
    })
  );
};

/** Pretend a user is logged in (a normal user by default, or an owner). */
export const loginAsUser = async (page: Page, role: "user" | "owner" = "user") => {
  await page.addInitScript((token) => localStorage.setItem("token", token), fakeToken(role));
  await page.route("**/api/user/data", (r) =>
    r.fulfill(
      json({
        success: true,
        user: { _id: "u1", name: "Test User", email: "test@example.com", role },
      })
    )
  );
};

/** An owner with a few months of revenue, for the dashboard. */
export const loginAsOwner = async (page: Page) => {
  await loginAsUser(page, "owner");
  const months = [
    ["2026-06", "Jun", 0, 0],
    ["2026-07", "Jul", 240, 2],
    ["2026-08", "Aug", 0, 0],
    ["2026-09", "Sep", 380, 3],
    ["2026-10", "Oct", 150, 1],
    ["2026-11", "Nov", 500, 2],
  ].map(([month, label, revenue, bookings]) => ({ month, label, revenue, bookings }));
  await page.route("**/api/owner/dashboard", (r) =>
    r.fulfill(
      json({
        success: true,
        dashboardData: {
          totalCars: 3,
          totalBookings: 8,
          pendingBookings: 1,
          completedBookings: 4,
          recentBookings: [],
          monthlyRevenue: 500,
          revenueByMonth: months,
        },
      })
    )
  );
};

export const test = base.extend<{ api: void }>({
  api: [
    async ({ page }, use) => {
      await mockApi(page);
      await use();
    },
    { auto: true },
  ],
});
export { expect };
