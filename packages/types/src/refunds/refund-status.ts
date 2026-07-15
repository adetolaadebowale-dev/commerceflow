/** Refund lifecycle statuses. */
export const REFUND_STATUSES = [
  "pending",
  "completed",
  "cancelled",
] as const;

export type RefundStatus = (typeof REFUND_STATUSES)[number];
