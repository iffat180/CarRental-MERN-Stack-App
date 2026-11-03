import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import RevenueChart from "../../components/owner/RevenueChart";

const data = [
  { month: "2026-09", label: "Sep", revenue: 0, bookings: 0 },
  { month: "2026-10", label: "Oct", revenue: 150, bookings: 1 },
  { month: "2026-11", label: "Nov", revenue: 500, bookings: 2 },
];

describe("RevenueChart", () => {
  it("gives screen readers the numbers as a table", () => {
    render(<RevenueChart data={data} currency="$" />);
    const table = screen.getByRole("table", { name: "Revenue by month" });

    const rows = within(table).getAllByRole("row");
    expect(rows).toHaveLength(4); // header + 3 months
    expect(within(rows[3]).getByText("$500")).toBeTruthy();
    expect(within(rows[3]).getByText("2026-11")).toBeTruthy();
  });

  it("summarises the total in a caption", () => {
    render(<RevenueChart data={data} currency="$" />);
    expect(screen.getByText(/\$650 in total over the last 3 months/)).toBeTruthy();
  });

  it("hides the graphic itself from assistive technology", () => {
    render(<RevenueChart data={data} currency="$" />);
    expect(screen.getByTestId("revenue-chart").getAttribute("aria-hidden")).toBe("true");
  });
});
