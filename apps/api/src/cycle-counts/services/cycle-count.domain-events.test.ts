import { describe, expect, it, vi } from "vitest";

import { createTestDomainEventPublisher } from "@/domain-events/testing/domain-events-test-utils";
import {
  createMemoryCycleCountModule,
  seedCompletedCycleCount,
  TEST_STORE_A_ID,
} from "../testing/cycle-count-test-utils";
import { seedInventoryItemForAdjustments } from "../../inventory-adjustments/testing/inventory-adjustment-test-utils";

const TEST_USER_ID = "99999999-9999-9999-9999-999999999999";

describe("CycleCountService domain events", () => {
  it("emits cycle count lifecycle and stock movement events", async () => {
    const { dispatcher, publisher } = createTestDomainEventPublisher();
    const createdHandler = vi.fn();
    const startedHandler = vi.fn();
    const completedHandler = vi.fn();
    const approvedHandler = vi.fn();
    const stockMovementHandler = vi.fn();
    const adjustedHandler = vi.fn();

    dispatcher.subscribe("cycle-count.created", createdHandler);
    dispatcher.subscribe("cycle-count.started", startedHandler);
    dispatcher.subscribe("cycle-count.completed", completedHandler);
    dispatcher.subscribe("cycle-count.approved", approvedHandler);
    dispatcher.subscribe("stock-movement.created", stockMovementHandler);
    dispatcher.subscribe("inventory.adjusted", adjustedHandler);

    const module = createMemoryCycleCountModule({ domainEventPublisher: publisher });
    const { inventoryItem } = await seedInventoryItemForAdjustments(module);

    const cycleCount = await module.cycleCountService.createCycleCount({
      storeId: TEST_STORE_A_ID,
      inventoryItemIds: [inventoryItem.id],
    });

    await module.cycleCountService.startCycleCount(cycleCount.id, {
      storeId: TEST_STORE_A_ID,
    });

    const item = cycleCount.items[0]!;

    await module.cycleCountService.completeCycleCount(cycleCount.id, {
      storeId: TEST_STORE_A_ID,
      items: [{ cycleCountItemId: item.id, countedQuantity: 8 }],
    });

    await module.cycleCountService.approveCycleCount(
      cycleCount.id,
      { storeId: TEST_STORE_A_ID },
      TEST_USER_ID,
    );

    await vi.waitFor(() => {
      expect(createdHandler).toHaveBeenCalledOnce();
      expect(startedHandler).toHaveBeenCalledOnce();
      expect(completedHandler).toHaveBeenCalledOnce();
      expect(approvedHandler).toHaveBeenCalledOnce();
      expect(stockMovementHandler).toHaveBeenCalledOnce();
      expect(adjustedHandler).toHaveBeenCalledOnce();
    });
  });

  it("does not emit stock events when variance is zero", async () => {
    const { dispatcher, publisher } = createTestDomainEventPublisher();
    const stockMovementHandler = vi.fn();

    dispatcher.subscribe("stock-movement.created", stockMovementHandler);

    const module = createMemoryCycleCountModule({ domainEventPublisher: publisher });
    const { cycleCount } = await seedCompletedCycleCount(module, {
      initialQuantity: 10,
      countedQuantity: 10,
    });

    await module.cycleCountService.approveCycleCount(
      cycleCount.id,
      { storeId: TEST_STORE_A_ID },
      TEST_USER_ID,
    );

    expect(stockMovementHandler).not.toHaveBeenCalled();
  });
});
