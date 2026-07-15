import { describe, expect, it, vi } from "vitest";

import { createTestDomainEventPublisher } from "@/domain-events/testing/domain-events-test-utils";
import {
  createMemoryReturnModule,
  seedRequestedReturn,
  TEST_STORE_A_ID,
} from "../testing/return-test-utils";

describe("ReturnService domain events", () => {
  it("emits return lifecycle and stock-movement events", async () => {
    const { dispatcher, publisher } = createTestDomainEventPublisher();
    const createdHandler = vi.fn();
    const receivedHandler = vi.fn();
    const inspectedHandler = vi.fn();
    const completedHandler = vi.fn();
    const stockMovementHandler = vi.fn();

    dispatcher.subscribe("return.created", createdHandler);
    dispatcher.subscribe("return.received", receivedHandler);
    dispatcher.subscribe("return.inspected", inspectedHandler);
    dispatcher.subscribe("return.completed", completedHandler);
    dispatcher.subscribe("stock-movement.created", stockMovementHandler);

    const module = createMemoryReturnModule({ domainEventPublisher: publisher });
    const { returnRecord } = await seedRequestedReturn(module);
    const item = returnRecord.items[0]!;

    createdHandler.mockClear();
    stockMovementHandler.mockClear();

    await module.returnService.receiveReturn(returnRecord.id, {
      storeId: TEST_STORE_A_ID,
      items: [{ returnItemId: item.id, quantityReceived: item.quantityRequested }],
    });

    await module.returnService.inspectReturn(returnRecord.id, {
      storeId: TEST_STORE_A_ID,
      items: [{ returnItemId: item.id, condition: "new" }],
    });

    const result = await module.returnService.completeReturn(returnRecord.id, {
      storeId: TEST_STORE_A_ID,
    });

    await vi.waitFor(() => {
      expect(receivedHandler).toHaveBeenCalledOnce();
      expect(inspectedHandler).toHaveBeenCalledOnce();
      expect(completedHandler).toHaveBeenCalledOnce();
      expect(stockMovementHandler).toHaveBeenCalledOnce();
    });

    expect(completedHandler.mock.calls[0]?.[0]).toMatchObject({
      eventType: "return.completed",
      aggregateId: result.return.id,
    });
  });
});
