import { describe, expect, it, vi } from "vitest";

import { createTestDomainEventPublisher } from "@/domain-events/testing/domain-events-test-utils";
import {
  createMemoryPaymentModule,
  createPendingPayment,
  TEST_STORE_A_ID,
} from "../testing/payment-test-utils";

describe("PaymentService domain events", () => {
  it("emits payment.created after successful creation", async () => {
    const { dispatcher, publisher } = createTestDomainEventPublisher();
    const handler = vi.fn();
    dispatcher.subscribe("payment.created", handler);

    const module = createMemoryPaymentModule({ domainEventPublisher: publisher });
    const { payment } = await createPendingPayment(module);

    await vi.waitFor(() => {
      expect(handler).toHaveBeenCalledOnce();
    });

    expect(handler.mock.calls[0]?.[0]).toMatchObject({
      eventType: "payment.created",
      aggregateId: payment.id,
      storeId: TEST_STORE_A_ID,
    });
  });

  it("emits payment.authorized and payment.paid during lifecycle", async () => {
    const { dispatcher, publisher } = createTestDomainEventPublisher();
    const authorizedHandler = vi.fn();
    const paidHandler = vi.fn();
    dispatcher.subscribe("payment.authorized", authorizedHandler);
    dispatcher.subscribe("payment.paid", paidHandler);

    const module = createMemoryPaymentModule({ domainEventPublisher: publisher });
    const { payment } = await createPendingPayment(module);

    await module.paymentService.authorizePayment(
      { storeId: TEST_STORE_A_ID },
      payment.id,
    );
    await module.paymentService.markPaymentPaid(
      { storeId: TEST_STORE_A_ID },
      payment.id,
    );

    await vi.waitFor(() => {
      expect(authorizedHandler).toHaveBeenCalledOnce();
      expect(paidHandler).toHaveBeenCalledOnce();
    });
  });

  it("does not emit events when transition fails", async () => {
    const { dispatcher, publisher } = createTestDomainEventPublisher();
    const handler = vi.fn();
    dispatcher.subscribe("payment.paid", handler);

    const module = createMemoryPaymentModule({ domainEventPublisher: publisher });
    const { payment } = await createPendingPayment(module);

    await expect(
      module.paymentService.markPaymentPaid(
        { storeId: TEST_STORE_A_ID },
        payment.id,
      ),
    ).rejects.toMatchObject({ status: 409 });

    expect(handler).not.toHaveBeenCalled();
  });
});
