import type { PaymentGateway } from "@commerceflow/types";

import { InternalPaymentGateway } from "./internal-payment.gateway";
import {
  DefaultPaymentGatewayFactory,
  type PaymentGatewayFactory,
} from "./payment-gateway.factory";

const internalGateway: PaymentGateway = new InternalPaymentGateway("internal");
const manualGateway: PaymentGateway = new InternalPaymentGateway("manual");

const paymentGatewayFactory: PaymentGatewayFactory =
  new DefaultPaymentGatewayFactory(
    new Map([
      ["internal", internalGateway],
      ["manual", manualGateway],
    ]),
  );

export function getPaymentGatewayFactory(): PaymentGatewayFactory {
  return paymentGatewayFactory;
}

export type { PaymentGatewayFactory } from "./payment-gateway.factory";
export { InternalPaymentGateway } from "./internal-payment.gateway";
export { DefaultPaymentGatewayFactory } from "./payment-gateway.factory";
