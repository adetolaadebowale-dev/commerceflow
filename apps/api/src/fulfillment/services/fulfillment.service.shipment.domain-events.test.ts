import { describe, expect, it, vi } from "vitest";

import { createTestDomainEventPublisher } from "@/domain-events/testing/domain-events-test-utils";
import {
  createMemoryShipmentFulfillmentModule,
  seedPackedShipmentWithAllocations,
  TEST_STORE_A_ID,
} from "../testing/fulfillment-test-utils";

describe("FulfillmentService shipment domain events", () => {
  it("emits inventory.fulfilled and stock-movement.created after shipment fulfillment", async () => {
    const { dispatcher, publisher } = createTestDomainEventPublisher();
    const inventoryFulfilledHandler = vi.fn();
    const stockMovementCreatedHandler = vi.fn();
    dispatcher.subscribe("inventory.fulfilled", inventoryFulfilledHandler);
    dispatcher.subscribe("stock-movement.created", stockMovementCreatedHandler);

    const module = createMemoryShipmentFulfillmentModule({
      domainEventPublisher: publisher,
    });
    const { shipment } = await seedPackedShipmentWithAllocations(module);

    inventoryFulfilledHandler.mockClear();
    stockMovementCreatedHandler.mockClear();

    const result = await module.fulfillmentService.fulfillShipment(
      { storeId: TEST_STORE_A_ID },
      shipment.id,
    );

    await vi.waitFor(() => {
      expect(inventoryFulfilledHandler).toHaveBeenCalledOnce();
      expect(stockMovementCreatedHandler).toHaveBeenCalledOnce();
    });

    expect(inventoryFulfilledHandler.mock.calls[0]?.[0]).toMatchObject({
      eventType: "inventory.fulfilled",
      aggregateId: shipment.id,
      payload: {
        shipmentId: shipment.id,
        stockMovementCount: result.stockMovements.length,
      },
    });

    const movement = result.stockMovements[0];

    if (!movement) {
      throw new Error("Expected stock movement");
    }

    expect(stockMovementCreatedHandler.mock.calls[0]?.[0]).toMatchObject({
      eventType: "stock-movement.created",
      aggregateId: movement.id,
      payload: {
        stockMovementId: movement.id,
        inventoryItemId: movement.inventoryItemId,
        movementType: "fulfillment",
      },
    });
  });
});
