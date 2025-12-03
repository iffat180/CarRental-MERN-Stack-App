// Booking status constants
export const BOOKING_STATUS = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  CANCELLED: "cancelled",
};

// Status configuration with colors and labels
export const STATUS_CONFIG = {
  [BOOKING_STATUS.PENDING]: {
    label: "Pending",
    bgColor: "bg-yellow-100",
    textColor: "text-yellow-600",
  },
  [BOOKING_STATUS.CONFIRMED]: {
    label: "Confirmed",
    bgColor: "bg-green-100",
    textColor: "text-green-600",
  },
  [BOOKING_STATUS.CANCELLED]: {
    label: "Cancelled",
    bgColor: "bg-red-100",
    textColor: "text-red-600",
  },
};

// Status transition rules
export const STATUS_TRANSITIONS = {
  [BOOKING_STATUS.PENDING]: [BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.CANCELLED],
  [BOOKING_STATUS.CONFIRMED]: [], // Cannot transition from confirmed
  [BOOKING_STATUS.CANCELLED]: [], // Cannot transition from cancelled
};

// Validate status transition
export const canTransitionStatus = (currentStatus, newStatus) => {
  const allowedTransitions = STATUS_TRANSITIONS[currentStatus] || [];
  return allowedTransitions.includes(newStatus);
};

// Get status options for select dropdown
export const getStatusOptions = (currentStatus) => {
  const allowedTransitions = STATUS_TRANSITIONS[currentStatus] || [];
  return [
    { value: currentStatus, label: STATUS_CONFIG[currentStatus]?.label || currentStatus },
    ...allowedTransitions.map(status => ({
      value: status,
      label: STATUS_CONFIG[status]?.label || status,
    })),
  ];
};

// Get status badge classes
export const getStatusBadgeClasses = (status) => {
  const config = STATUS_CONFIG[status];
  if (!config) return "bg-gray-100 text-gray-600";
  return `${config.bgColor} ${config.textColor}`;
};

