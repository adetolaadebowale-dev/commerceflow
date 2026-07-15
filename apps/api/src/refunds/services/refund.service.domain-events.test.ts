import { describe, expect, it, vi } from "vitest";

import { createTestDomainEventPublisher } from "@/domain-events/testing/domain-events-test-utils";
import {
  createMemoryRefundModule,
  createPendingRefund,
  TEST_STORE_A_ID,
} from "../testing/refund-test-utils";

describe("RefundService domain events", () => {
  it("emits refund.created after successful creation", async () => {
    const { dispatcher, publisher } = createTestDomainEventPublisher();
    const handler = vi.fn();
    dispatcher.subscribe("refund.created", handler);

    const module = createMemoryRefundModule({ domainEventPublisher: publisher });
    const { refund } = await createPendingRefund(module);

    await vi.waitFor(() => {
      expect(handler).toHaveBeenCalledOnce();
    });

    expect(handler.mock.calls[0]?.[0]).toMatchObject({
      eventType: "refund.created",
      aggregateId: refund.id,
      storeId: TEST_STORE_A_ID,
    });
  });

  it("emits refund.completed and refund.cancelled during lifecycle", async () => {
    const { dispatcher, publisher } = createTestDomainEventPublisher();
    const completedHandler = vi.fn();
    const cancelledHandler = vi.fn();
    dispatcher.subscribe("refund.completed", completedHandler);
    dispatcher.subscribe("refund.cancelled", cancelledHandler);

    const completeModule = createMemoryRefundModule({
      domainEventPublisher: publisher,
    });
    const { refund: completedRefund } = await createPendingRefund(completeModule);

    await completeModule.refundService.completeRefund(
      { storeId: TEST_STORE_A_ID },
      completedRefund.id,
    );

    const cancelModule = createMemoryRefundModule({
      domainEventPublisher: publisher,
    });
    const { refund: cancelledRefund } = await createPendingRefund(cancelModule);

    await cancelModule.refundService.cancelRefund(
      { storeId: TEST_STORE_A_ID },
      cancelledRefund.id,
    );

    await vi.waitFor(() => {
      expect(completedHandler).toHaveBeenCalledOnce();
      expect(cancelledHandler).toHaveBeenCalledOnce();
    });
  });

  it("does not emit events when transition fails", async () => {
    const { dispatcher, publisher } = createTestDomainEventPublisher();
    const handler = vi.fn();
    dispatcher.subscribe("refund.completed", handler);

    const module = createMemoryRefundModule({ domainEventPublisher: publisher });
    const { refund } = await createPendingRefund(module);

    await module.refundService.cancelRefund(
      { storeId: TEST_STORE_A_ID },
      refund.id,
    );

    await expect(
      module.refundService.completeRefund(
        { storeId: TEST_STORE_A_ID },
        refund.id,
      ),
    ).rejects.toMatchObject({ status: 409 });

    expect(handler).not.toHaveBeenCalled();
  });
});
