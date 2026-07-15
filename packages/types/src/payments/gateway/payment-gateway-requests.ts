import type { PaymentProvider } from "../payment-provider";
import type { PaymentStatus } from "../payment-status";

/** Context shared by gateway operations after a payment record exists. */
export interface PaymentGatewayPaymentContext {
  readonly storeId: string;
  readonly orderId: string;
  readonly paymentId: string;
  readonly amount: string;
  readonly currency: string;
  readonly reference: string;
  readonly provider: PaymentProvider;
  readonly status: PaymentStatus;
  readonly metadata?: Record<string, unknown>;
}

/** Input for initializing a payment session before persistence. */
export interface PaymentGatewayInitializeRequest {
  readonly storeId: string;
  readonly orderId: string;
  readonly amount: string;
  readonly currency: string;
  readonly reference: string;
  readonly provider: PaymentProvider;
  readonly metadata?: Record<string, unknown>;
}
