import type { PaymentProvider } from "../payment-provider";
import type { PaymentGatewayInitializeRequest } from "./payment-gateway-requests";
import type { PaymentGatewayPaymentContext } from "./payment-gateway-requests";
import type { PaymentGatewayOperationResult } from "./payment-gateway-result";

/** Provider-agnostic payment gateway contract. */
export interface PaymentGateway {
  readonly provider: PaymentProvider;

  initializePayment(
    request: PaymentGatewayInitializeRequest,
  ): Promise<PaymentGatewayOperationResult>;

  authorizePayment(
    context: PaymentGatewayPaymentContext,
  ): Promise<PaymentGatewayOperationResult>;

  capturePayment(
    context: PaymentGatewayPaymentContext,
  ): Promise<PaymentGatewayOperationResult>;

  cancelPayment(
    context: PaymentGatewayPaymentContext,
  ): Promise<PaymentGatewayOperationResult>;

  verifyPayment(
    context: PaymentGatewayPaymentContext,
  ): Promise<PaymentGatewayOperationResult>;
}
