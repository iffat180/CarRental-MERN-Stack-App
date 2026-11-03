import React from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { MonthlyRevenue } from "../../types";

interface RevenueChartProps {
  data: MonthlyRevenue[];
  currency: string;
}

/**
 * Revenue for the last months as a bar chart.
 *
 * A chart is only pixels to a screen reader, so the same numbers are also given as
 * a visually hidden table, and the chart itself is hidden from assistive tech
 * (found by the axe scan: Recharts' keyboard layer was focusable inside that hidden box).
 */
const RevenueChart = ({ data, currency }: RevenueChartProps) => {
  const total = data.reduce((sum, m) => sum + m.revenue, 0);

  return (
    <figure className="m-0">
      <div className="h-56 w-full" aria-hidden="true" data-testid="revenue-chart">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 8, right: 8, left: -8, bottom: 0 }}
            // Recharts' own keyboard layer would be focusable inside the aria-hidden box;
            // the table below carries the data for assistive tech instead.
            accessibilityLayer={false}
          >
            <CartesianGrid vertical={false} stroke="rgba(20,24,28,0.12)" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#3C444D", fontSize: 12 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={48}
              allowDecimals={false}
              tick={{ fill: "#3C444D", fontSize: 12 }}
              tickFormatter={(v: number) => `${currency}${v}`}
            />
            <Tooltip
              cursor={{ fill: "rgba(20,24,28,0.06)" }}
              formatter={(value) => [`${currency}${value}`, "Revenue"]}
              contentStyle={{
                borderRadius: 12,
                border: "1px solid rgba(20,24,28,0.15)",
                fontSize: 13,
              }}
            />
            <Bar
              dataKey="revenue"
              fill="#14181C"
              radius={[6, 6, 0, 0]}
              maxBarSize={40}
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <figcaption className="sr-only">
        Revenue by month, {currency}
        {total} in total over the last {data.length} months.
      </figcaption>

      <table className="sr-only">
        <caption>Revenue by month</caption>
        <thead>
          <tr>
            <th scope="col">Month</th>
            <th scope="col">Revenue</th>
            <th scope="col">Bookings</th>
          </tr>
        </thead>
        <tbody>
          {data.map((m) => (
            <tr key={m.month}>
              <th scope="row">{m.month}</th>
              <td>
                {currency}
                {m.revenue}
              </td>
              <td>{m.bookings}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
};

export default RevenueChart;
