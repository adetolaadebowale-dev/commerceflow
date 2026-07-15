import type { PaymentProvider } from "@commerceflow/types";
import type { PaymentStatus } from "@commerceflow/types";

export interface CreatePaymentRecord {
  readonly storeId: string;
  readonly orderId: string;
  readonly amount: string;
  readonly currency: string;
  readonly provider: PaymentProvider;
  readonly reference: string;
  readonly metadata?: Record<string, unknown>;
}

export interface PaymentStatusTransitionInput {
  readonly fromStatus: PaymentStatus;
  readonly toStatus: PaymentStatus;
}
