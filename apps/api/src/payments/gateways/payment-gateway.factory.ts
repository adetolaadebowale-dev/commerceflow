import type { PaymentGateway, PaymentProvider } from "@commerceflow/types";

import { PAYMENT_ERROR_CODES, PaymentError } from "../errors";

export interface PaymentGatewayFactory {
  resolve(provider: PaymentProvider): PaymentGateway;
}

export class DefaultPaymentGatewayFactory implements PaymentGatewayFactory {
  constructor(
    private readonly gateways: ReadonlyMap<PaymentProvider, PaymentGateway>,
  ) {}

  resolve(provider: PaymentProvider): PaymentGateway {
    const gateway = this.gateways.get(provider);

    if (!gateway) {
      throw new PaymentError(
        PAYMENT_ERROR_CODES.UNSUPPORTED_PROVIDER,
        `Unsupported payment provider: ${provider}`,
        400,
      );
    }

    return gateway;
  }
}
