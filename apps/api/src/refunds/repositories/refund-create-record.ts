import type { RefundStatus } from "@commerceflow/types";

export interface CreateRefundRecord {
  readonly storeId: string;
  readonly paymentId: string;
  readonly amount: string;
  readonly currency: string;
  readonly reason: string;
}

export interface RefundStatusTransitionInput {
  readonly fromStatus: RefundStatus;
  readonly toStatus: RefundStatus;
  readonly completedAt?: string;
}
