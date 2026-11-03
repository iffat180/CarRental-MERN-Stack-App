import type { Meta, StoryObj } from "@storybook/react-vite";
import EmptyState from "../components/owner/EmptyState";
import ErrorState from "../components/owner/ErrorState";
import LoadingState from "../components/owner/LoadingState";

const meta = { title: "Feedback/States" } satisfies Meta;
export default meta;

export const Empty: StoryObj = {
  render: () => <EmptyState title="No cars found" message="You haven't added any cars yet." />,
};
export const Error: StoryObj = {
  render: () => (
    <ErrorState error="Failed to fetch bookings" onRetry={() => {}} retryLabel="Retry" />
  ),
};
export const Loading: StoryObj = {
  render: () => <LoadingState message="Loading dashboard data..." />,
};
