import { describe, it, expect } from "@jest/globals";
import { fillMonthlyRevenue, revenueWindowStart } from "../../utils/revenue.js";

const NOW = new Date(Date.UTC(2026, 10, 15)); // 15 Nov 2026

describe("revenueWindowStart", () => {
  it("is the first day of the month five months back for a 6-month window", () => {
    expect(revenueWindowStart(NOW, 6).toISOString()).toBe("2026-06-01T00:00:00.000Z");
  });

  it("crosses a year boundary", () => {
    expect(revenueWindowStart(new Date(Date.UTC(2026, 1, 10)), 6).toISOString()).toBe(
      "2025-09-01T00:00:00.000Z"
    );
  });
});

describe("fillMonthlyRevenue", () => {
  it("returns exactly 6 consecutive months ending with the current one", () => {
    const months = fillMonthlyRevenue([], NOW, 6);
    expect(months.map((m) => m.month)).toEqual([
      "2026-06",
      "2026-07",
      "2026-08",
      "2026-09",
      "2026-10",
      "2026-11",
    ]);
    expect(months.map((m) => m.label)).toEqual(["Jun", "Jul", "Aug", "Sep", "Oct", "Nov"]);
  });

  it("fills months without bookings with zeros", () => {
    const months = fillMonthlyRevenue([], NOW, 6);
    expect(months.every((m) => m.revenue === 0 && m.bookings === 0)).toBe(true);
  });

  it("places grouped rows in the right month", () => {
    const months = fillMonthlyRevenue(
      [
        { _id: { y: 2026, m: 11 }, revenue: 450, bookings: 3 },
        { _id: { y: 2026, m: 8 }, revenue: 120, bookings: 1 },
      ],
      NOW,
      6
    );
    expect(months.find((m) => m.month === "2026-11")).toMatchObject({ revenue: 450, bookings: 3 });
    expect(months.find((m) => m.month === "2026-08")).toMatchObject({ revenue: 120, bookings: 1 });
    expect(months.find((m) => m.month === "2026-09")?.revenue).toBe(0);
  });

  it("handles a window that spans two years", () => {
    const months = fillMonthlyRevenue(
      [{ _id: { y: 2025, m: 12 }, revenue: 99, bookings: 1 }],
      new Date(Date.UTC(2026, 2, 5)),
      6
    );
    expect(months.map((m) => m.month)).toEqual([
      "2025-10",
      "2025-11",
      "2025-12",
      "2026-01",
      "2026-02",
      "2026-03",
    ]);
    expect(months[2].revenue).toBe(99);
  });

  it("ignores rows outside the window", () => {
    const months = fillMonthlyRevenue(
      [{ _id: { y: 2020, m: 1 }, revenue: 5000, bookings: 9 }],
      NOW,
      6
    );
    expect(months.reduce((a, m) => a + m.revenue, 0)).toBe(0);
  });
});
