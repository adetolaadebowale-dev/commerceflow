import { describe, expect, it, vi } from "vitest";

import { createTestDomainEventPublisher } from "@/domain-events/testing/domain-events-test-utils";
import {
  createDraftOrder,
  createMemoryOrderService,
  TEST_STORE_A_ID,
} from "../testing/order-test-utils";
import { OrderService } from "./order.service";

describe("OrderService domain events", () => {
  it("emits order.confirmed after successful confirmation", async () => {
    const { dispatcher, publisher } = createTestDomainEventPublisher();
    const handler = vi.fn();
    dispatcher.subscribe("order.confirmed", handler);

    const { orderRepository, variantSnapshotReader } =
      createMemoryOrderService();
    const orderService = new OrderService({
      orderRepository,
      orderVariantSnapshotReader: variantSnapshotReader,
      domainEventPublisher: publisher,
    });
    const draft = await createDraftOrder(orderService, variantSnapshotReader);

    await orderService.confirmOrder({ storeId: TEST_STORE_A_ID }, draft.id);

    await vi.waitFor(() => {
      expect(handler).toHaveBeenCalledOnce();
    });

    expect(handler.mock.calls[0]?.[0]).toMatchObject({
      eventType: "order.confirmed",
      aggregateId: draft.id,
      storeId: TEST_STORE_A_ID,
      payload: {
        orderId: draft.id,
        previousStatus: "draft",
        status: "confirmed",
      },
    });
  });

  it("emits order.cancelled after successful cancellation", async () => {
    const { dispatcher, publisher } = createTestDomainEventPublisher();
    const handler = vi.fn();
    dispatcher.subscribe("order.cancelled", handler);

    const { orderRepository, variantSnapshotReader } =
      createMemoryOrderService();
    const orderService = new OrderService({
      orderRepository,
      orderVariantSnapshotReader: variantSnapshotReader,
      domainEventPublisher: publisher,
    });
    const draft = await createDraftOrder(orderService, variantSnapshotReader);

    await orderService.cancelOrder({ storeId: TEST_STORE_A_ID }, draft.id);

    await vi.waitFor(() => {
      expect(handler).toHaveBeenCalledOnce();
    });

    expect(handler.mock.calls[0]?.[0].eventType).toBe("order.cancelled");
  });

  it("does not emit events when confirmation fails", async () => {
    const { dispatcher, publisher } = createTestDomainEventPublisher();
    const handler = vi.fn();
    dispatcher.subscribe("order.confirmed", handler);

    const { orderRepository, variantSnapshotReader } =
      createMemoryOrderService();
    const orderService = new OrderService({
      orderRepository,
      orderVariantSnapshotReader: variantSnapshotReader,
      domainEventPublisher: publisher,
    });

    await expect(
      orderService.confirmOrder(
        { storeId: TEST_STORE_A_ID },
        "99999999-9999-9999-9999-999999999999",
      ),
    ).rejects.toMatchObject({ status: 404 });

    expect(handler).not.toHaveBeenCalled();
  });
});
