/**
 * Revenue by month for the owner dashboard.
 *
 * Revenue counts bookings that are confirmed or completed (not pending or
 * cancelled) and is attributed to the month of the pickup date, which is when the
 * rental actually happens.
 */

export interface MonthlyRevenue {
  /** "2026-11" */
  month: string;
  /** "Nov" */
  label: string;
  revenue: number;
  bookings: number;
}

/** One row of the Mongo $group result: _id.y = year, _id.m = month (1-12). */
export interface RevenueGroupRow {
  _id: { y: number; m: number };
  revenue: number;
  bookings: number;
}

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/** The first day (UTC) of the month `count - 1` months before `now`'s month. */
export const revenueWindowStart = (now: Date, count = 6): Date =>
  new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (count - 1), 1));

/**
 * Turns the grouped rows into exactly `count` consecutive months ending with the
 * current one, filling months with no bookings with zeros so the chart has no gaps.
 */
export const fillMonthlyRevenue = (
  rows: RevenueGroupRow[],
  now: Date,
  count = 6
): MonthlyRevenue[] => {
  const byKey = new Map(rows.map((r) => [`${r._id.y}-${r._id.m}`, r]));
  const result: MonthlyRevenue[] = [];

  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    const y = d.getUTCFullYear();
    const m = d.getUTCMonth() + 1;
    const row = byKey.get(`${y}-${m}`);
    result.push({
      month: `${y}-${String(m).padStart(2, "0")}`,
      label: MONTH_LABELS[m - 1],
      revenue: row?.revenue ?? 0,
      bookings: row?.bookings ?? 0,
    });
  }
  return result;
};
