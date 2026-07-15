import type { PaymentProvider } from "./payment-provider";
import type { PaymentStatus } from "./payment-status";

/** Store-scoped payment record linked to an order. */
export interface Payment {
  readonly id: string;
  readonly storeId: string;
  readonly orderId: string;
  readonly amount: string;
  readonly currency: string;
  readonly status: PaymentStatus;
  readonly provider: PaymentProvider;
  readonly reference: string;
  readonly metadata?: Record<string, unknown>;
  readonly createdAt: string;
  readonly updatedAt: string;
}
