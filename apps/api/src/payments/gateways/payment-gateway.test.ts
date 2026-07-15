import { describe, expect, it } from "vitest";

import type {
  PaymentGateway,
  PaymentGatewayInitializeRequest,
  PaymentGatewayPaymentContext,
  PaymentProvider,
} from "@commerceflow/types";

import { InternalPaymentGateway } from "./internal-payment.gateway";
import {
  DefaultPaymentGatewayFactory,
  type PaymentGatewayFactory,
} from "./payment-gateway.factory";

describe("InternalPaymentGateway", () => {
  const gateway = new InternalPaymentGateway("internal");

  const initializeRequest: PaymentGatewayInitializeRequest = {
    storeId: "11111111-1111-1111-1111-111111111111",
    orderId: "22222222-2222-2222-2222-222222222222",
    amount: "39.98",
    currency: "USD",
    reference: "PAY-TEST-REF",
    provider: "internal",
  };

  const paymentContext: PaymentGatewayPaymentContext = {
    storeId: initializeRequest.storeId,
    orderId: initializeRequest.orderId,
    paymentId: "33333333-3333-3333-3333-333333333333",
    amount: initializeRequest.amount,
    currency: initializeRequest.currency,
    reference: initializeRequest.reference,
    provider: "internal",
    status: "pending",
  };

  it("simulates successful initialize, authorize, capture, cancel, and verify", async () => {
    const initialized = await gateway.initializePayment(initializeRequest);
    expect(initialized.success).toBe(true);
    expect(initialized.gatewayReference).toContain("INITIALIZE");

    const authorized = await gateway.authorizePayment({
      ...paymentContext,
      status: "pending",
    });
    expect(authorized.success).toBe(true);

    const captured = await gateway.capturePayment({
      ...paymentContext,
      status: "authorized",
    });
    expect(captured.success).toBe(true);

    const cancelled = await gateway.cancelPayment({
      ...paymentContext,
      status: "pending",
    });
    expect(cancelled.success).toBe(true);

    const verified = await gateway.verifyPayment({
      ...paymentContext,
      status: "paid",
    });
    expect(verified.success).toBe(true);
  });

  it("simulates failure when simulateGatewayFailure metadata is set", async () => {
    const result = await gateway.initializePayment({
      ...initializeRequest,
      metadata: { simulateGatewayFailure: true },
    });

    expect(result.success).toBe(false);
  });

  it("reports verify failure for non-settled statuses", async () => {
    const result = await gateway.verifyPayment({
      ...paymentContext,
      status: "pending",
    });

    expect(result.success).toBe(false);
  });
});

describe("DefaultPaymentGatewayFactory", () => {
  function createFactory(
    gateways: ReadonlyMap<PaymentProvider, PaymentGateway>,
  ): PaymentGatewayFactory {
    return new DefaultPaymentGatewayFactory(gateways);
  }

  it("resolves internal and manual providers", () => {
    const internal = new InternalPaymentGateway("internal");
    const manual = new InternalPaymentGateway("manual");
    const factory = createFactory(
      new Map([
        ["internal", internal],
        ["manual", manual],
      ]),
    );

    expect(factory.resolve("internal")).toBe(internal);
    expect(factory.resolve("manual")).toBe(manual);
  });

  it("throws for unsupported providers", () => {
    const factory = createFactory(
      new Map([["internal", new InternalPaymentGateway("internal")]]),
    );

    expect(() => factory.resolve("manual")).toThrow(/Unsupported payment provider/);
  });
});
