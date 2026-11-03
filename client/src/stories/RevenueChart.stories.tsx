import type { Meta, StoryObj } from "@storybook/react-vite";
import RevenueChart from "../components/owner/RevenueChart";

const months = [
  ["2026-06", "Jun", 0, 0],
  ["2026-07", "Jul", 240, 2],
  ["2026-08", "Aug", 410, 3],
  ["2026-09", "Sep", 380, 3],
  ["2026-10", "Oct", 150, 1],
  ["2026-11", "Nov", 500, 2],
].map(([month, label, revenue, bookings]) => ({
  month: month as string,
  label: label as string,
  revenue: revenue as number,
  bookings: bookings as number,
}));

const meta = {
  title: "Owner/RevenueChart",
  component: RevenueChart,
  args: { data: months, currency: "$" },
  parameters: {
    docs: {
      description: {
        component:
          "Bar chart of revenue by month. The graphic is hidden from assistive technology; the same numbers are in a visually hidden table with a caption.",
      },
    },
  },
} satisfies Meta<typeof RevenueChart>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const NoRevenueYet: Story = {
  args: { data: months.map((m) => ({ ...m, revenue: 0, bookings: 0 })) },
};
