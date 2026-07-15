import type { RefundStatus } from "./refund-status";

/** Store-scoped refund linked to a payment. */
export interface Refund {
  readonly id: string;
  readonly storeId: string;
  readonly paymentId: string;
  readonly amount: string;
  readonly currency: string;
  readonly status: RefundStatus;
  readonly reason: string;
  readonly completedAt?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}
