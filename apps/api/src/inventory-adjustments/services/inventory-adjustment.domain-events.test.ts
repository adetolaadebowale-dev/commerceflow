import { describe, expect, it, vi } from "vitest";

import { createTestDomainEventPublisher } from "@/domain-events/testing/domain-events-test-utils";
import {
  createMemoryInventoryAdjustmentModule,
  seedInventoryItemForAdjustments,
  TEST_STORE_A_ID,
} from "../testing/inventory-adjustment-test-utils";

const TEST_USER_ID = "99999999-9999-9999-9999-999999999999";

describe("InventoryAdjustmentService domain events", () => {
  it("emits inventory.adjusted and stock-movement.created", async () => {
    const { dispatcher, publisher } = createTestDomainEventPublisher();
    const adjustedHandler = vi.fn();
    const stockMovementHandler = vi.fn();

    dispatcher.subscribe("inventory.adjusted", adjustedHandler);
    dispatcher.subscribe("stock-movement.created", stockMovementHandler);

    const module = createMemoryInventoryAdjustmentModule({
      domainEventPublisher: publisher,
    });
    const { inventoryItem } = await seedInventoryItemForAdjustments(module);

    const result = await module.inventoryAdjustmentService.createAdjustment(
      {
        storeId: TEST_STORE_A_ID,
        inventoryItemId: inventoryItem.id,
        movementQuantity: 2,
        reason: "Cycle count correction",
      },
      TEST_USER_ID,
    );

    await vi.waitFor(() => {
      expect(adjustedHandler).toHaveBeenCalledOnce();
      expect(stockMovementHandler).toHaveBeenCalledOnce();
    });

    expect(adjustedHandler.mock.calls[0]?.[0]).toMatchObject({
      eventType: "inventory.adjusted",
      aggregateId: result.adjustment.id,
    });
  });
});
