import { describe, expect, it, vi } from "vitest";

import type {
  PaymentGateway,
  PaymentGatewayInitializeRequest,
  PaymentGatewayOperationResult,
  PaymentGatewayPaymentContext,
  PaymentProvider,
} from "@commerceflow/types";

import { PAYMENT_ERROR_CODES } from "../errors";
import {
  DefaultPaymentGatewayFactory,
  InternalPaymentGateway,
} from "../gateways";
import {
  createMemoryPaymentModule,
  createPendingPayment,
  seedPaymentScenario,
  TEST_STORE_A_ID,
  validPaymentInput,
} from "../testing/payment-test-utils";

class StubPaymentGateway implements PaymentGateway {
  readonly provider: PaymentProvider;
  readonly operations: string[] = [];
  readonly failOperations = new Set<string>();

  constructor(provider: PaymentProvider) {
    this.provider = provider;
  }

  fail(operation: string): void {
    this.failOperations.add(operation);
  }

  private result(operation: string): PaymentGatewayOperationResult {
    this.operations.push(operation);

    if (this.failOperations.has(operation)) {
      return {
        success: false,
        message: `${operation} failed in stub gateway`,
      };
    }

    return {
      success: true,
      gatewayReference: `STUB-${operation.toUpperCase()}`,
    };
  }

  initializePayment(_request: PaymentGatewayInitializeRequest) {
    return Promise.resolve(this.result("initialize"));
  }

  authorizePayment(_context: PaymentGatewayPaymentContext) {
    return Promise.resolve(this.result("authorize"));
  }

  capturePayment(_context: PaymentGatewayPaymentContext) {
    return Promise.resolve(this.result("capture"));
  }

  cancelPayment(_context: PaymentGatewayPaymentContext) {
    return Promise.resolve(this.result("cancel"));
  }

  verifyPayment(_context: PaymentGatewayPaymentContext) {
    return Promise.resolve(this.result("verify"));
  }
}

function createGatewayBackedModule(stub: StubPaymentGateway) {
  return createMemoryPaymentModule({
    paymentGatewayFactory: new DefaultPaymentGatewayFactory(
      new Map([[stub.provider, stub]]),
    ),
  });
}

describe("PaymentService gateway integration", () => {
  it("uses injected gateway during payment creation", async () => {
    const stub = new StubPaymentGateway("internal");
    const module = createGatewayBackedModule(stub);
    const { order } = await seedPaymentScenario(module);

    await module.paymentService.createPayment(
      TEST_STORE_A_ID,
      order.id,
      validPaymentInput(),
    );

    expect(stub.operations).toContain("initialize");
  });

  it("calls authorize and capture gateway operations during lifecycle", async () => {
    const stub = new StubPaymentGateway("internal");
    const module = createGatewayBackedModule(stub);
    const { payment } = await createPendingPayment(module);

    await module.paymentService.authorizePayment(
      { storeId: TEST_STORE_A_ID },
      payment.id,
    );
    await module.paymentService.markPaymentPaid(
      { storeId: TEST_STORE_A_ID },
      payment.id,
    );

    expect(stub.operations).toEqual(
      expect.arrayContaining(["initialize", "authorize", "capture"]),
    );
  });

  it("propagates gateway failures without persisting lifecycle transitions", async () => {
    const stub = new StubPaymentGateway("internal");
    stub.fail("authorize");
    const module = createGatewayBackedModule(stub);
    const { payment } = await createPendingPayment(module);

    await expect(
      module.paymentService.authorizePayment(
        { storeId: TEST_STORE_A_ID },
        payment.id,
      ),
    ).rejects.toMatchObject({
      code: PAYMENT_ERROR_CODES.GATEWAY_ERROR,
      status: 502,
    });

    const unchanged = await module.paymentService.getPayment(
      TEST_STORE_A_ID,
      payment.id,
    );
    expect(unchanged.status).toBe("pending");
  });

  it("does not call gateway for manual fail transitions", async () => {
    const stub = new StubPaymentGateway("internal");
    const module = createGatewayBackedModule(stub);
    const { payment } = await createPendingPayment(module);
    stub.operations.length = 0;

    await module.paymentService.failPayment(
      { storeId: TEST_STORE_A_ID },
      payment.id,
    );

    expect(stub.operations).not.toContain("fail");
    expect(stub.operations).toHaveLength(0);
  });

  it("resolves manual provider through factory-backed service", async () => {
    const manualGateway = new InternalPaymentGateway("manual");
    const initializeSpy = vi.spyOn(manualGateway, "initializePayment");
    const module = createMemoryPaymentModule({
      paymentGatewayFactory: new DefaultPaymentGatewayFactory(
        new Map([["manual", manualGateway]]),
      ),
    });
    const { order } = await seedPaymentScenario(module);

    await module.paymentService.createPayment(
      TEST_STORE_A_ID,
      order.id,
      validPaymentInput({ provider: "manual" }),
    );

    expect(initializeSpy).toHaveBeenCalledOnce();
  });
});
