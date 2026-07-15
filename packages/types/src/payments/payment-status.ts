/** Internal payment lifecycle statuses. */
export const PAYMENT_STATUSES = [
  "pending",
  "authorized",
  "paid",
  "failed",
  "cancelled",
] as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];
