import { describe, expect, it, vi } from "vitest";

import { createTestDomainEventPublisher } from "@/domain-events/testing/domain-events-test-utils";
import {
  createMemoryInventoryAllocationModule,
  seedPickingAllocation,
  TEST_STORE_A_ID,
} from "../testing/inventory-allocation-test-utils";

describe("InventoryAllocationService domain events", () => {
  it("emits allocation lifecycle events", async () => {
    const { dispatcher, publisher } = createTestDomainEventPublisher();
    const allocatedHandler = vi.fn();
    const partiallyPickedHandler = vi.fn();
    const pickedHandler = vi.fn();
    const shortageHandler = vi.fn();
    dispatcher.subscribe("inventory.allocated", allocatedHandler);
    dispatcher.subscribe("inventory.partially-picked", partiallyPickedHandler);
    dispatcher.subscribe("inventory.picked", pickedHandler);
    dispatcher.subscribe("inventory.shortage-reported", shortageHandler);

    const module = createMemoryInventoryAllocationModule({
      domainEventPublisher: publisher,
    });
    const { allocation } = await seedPickingAllocation(module, {
      quantityAllocated: 4,
      orderQuantity: 4,
    });

    await module.inventoryAllocationService.updatePickedQuantity(
      TEST_STORE_A_ID,
      allocation.id,
      { quantityPicked: 2 },
    );

    await module.inventoryAllocationService.updatePickedQuantity(
      TEST_STORE_A_ID,
      allocation.id,
      { quantityPicked: 4 },
    );

    const shortageModule = createMemoryInventoryAllocationModule({
      domainEventPublisher: publisher,
    });
    const { allocation: shortageAllocation } = await seedPickingAllocation(
      shortageModule,
      {
        quantityAllocated: 2,
        orderQuantity: 2,
      },
    );

    await shortageModule.inventoryAllocationService.reportShortage(
      TEST_STORE_A_ID,
      shortageAllocation.id,
      { shortageReason: "Missing stock" },
    );

    await vi.waitFor(() => {
      expect(allocatedHandler.mock.calls.length).toBeGreaterThanOrEqual(2);
      expect(partiallyPickedHandler).toHaveBeenCalledOnce();
      expect(pickedHandler).toHaveBeenCalledOnce();
      expect(shortageHandler).toHaveBeenCalledOnce();
    });

    expect(allocatedHandler.mock.calls[0]?.[0]).toMatchObject({
      eventType: "inventory.allocated",
      aggregateType: "inventory_allocation",
      storeId: TEST_STORE_A_ID,
    });
  });
});
