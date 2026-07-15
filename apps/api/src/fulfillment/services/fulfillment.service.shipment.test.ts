import { describe, expect, it } from "vitest";

import { FULFILLMENT_ERROR_CODES } from "../errors";
import {
  createMemoryShipmentFulfillmentModule,
  seedPackedShipmentWithAllocations,
  seedPickedNotPackedShipment,
  TEST_STORE_A_ID,
  TEST_STORE_B_ID,
} from "../testing/fulfillment-test-utils";

describe("FulfillmentService shipment fulfillment", () => {
  it("fulfills a packed shipment with picked allocations", async () => {
    const module = createMemoryShipmentFulfillmentModule();
    const { shipment, inventoryItem, allocation } =
      await seedPackedShipmentWithAllocations(module, {
        initialQuantity: 10,
        orderQuantity: 2,
      });

    const result = await module.fulfillmentService.fulfillShipment(
      { storeId: TEST_STORE_A_ID },
      shipment.id,
    );

    expect(result.shipment.fulfilledAt).toBeDefined();
    expect(result.stockMovements).toHaveLength(1);
    expect(result.stockMovements[0]).toMatchObject({
      inventoryItemId: inventoryItem.id,
      shipmentId: shipment.id,
      inventoryAllocationId: allocation.id,
      movementType: "fulfillment",
      quantity: -2,
      previousQuantityOnHand: 8,
      newQuantityOnHand: 6,
    });
    expect(result.allocations[0]?.status).toBe("fulfilled");
    expect(result.inventoryItems[0]?.quantityOnHand).toBe(6);
  });

  it("rejects duplicate shipment fulfillment", async () => {
    const module = createMemoryShipmentFulfillmentModule();
    const { shipment } = await seedPackedShipmentWithAllocations(module);

    await module.fulfillmentService.fulfillShipment(
      { storeId: TEST_STORE_A_ID },
      shipment.id,
    );

    await expect(
      module.fulfillmentService.fulfillShipment(
        { storeId: TEST_STORE_A_ID },
        shipment.id,
      ),
    ).rejects.toMatchObject({
      code: FULFILLMENT_ERROR_CODES.SHIPMENT_ALREADY_FULFILLED,
      status: 409,
    });
  });

  it("rejects fulfillment when pick list is not packed", async () => {
    const module = createMemoryShipmentFulfillmentModule();
    const { shipment } = await seedPickedNotPackedShipment(module);

    await expect(
      module.fulfillmentService.fulfillShipment(
        { storeId: TEST_STORE_A_ID },
        shipment.id,
      ),
    ).rejects.toMatchObject({
      code: FULFILLMENT_ERROR_CODES.PICK_LIST_NOT_PACKED,
      status: 409,
    });
  });

  it("lists stock movements for an inventory item", async () => {
    const module = createMemoryShipmentFulfillmentModule();
    const { shipment, inventoryItem } =
      await seedPackedShipmentWithAllocations(module);

    await module.fulfillmentService.fulfillShipment(
      { storeId: TEST_STORE_A_ID },
      shipment.id,
    );

    const listed = await module.fulfillmentService.listStockMovements(
      inventoryItem.id,
      { storeId: TEST_STORE_A_ID, page: 1, limit: 10 },
    );

    expect(listed.items.length).toBeGreaterThanOrEqual(1);
    expect(listed.items.some((entry) => entry.shipmentId === shipment.id)).toBe(
      true,
    );
  });

  it("gets a stock movement by id", async () => {
    const module = createMemoryShipmentFulfillmentModule();
    const { shipment } = await seedPackedShipmentWithAllocations(module);

    const result = await module.fulfillmentService.fulfillShipment(
      { storeId: TEST_STORE_A_ID },
      shipment.id,
    );

    const movement = result.stockMovements[0];

    if (!movement) {
      throw new Error("Expected stock movement");
    }

    const fetched = await module.fulfillmentService.getStockMovement(
      { storeId: TEST_STORE_A_ID },
      movement.id,
    );

    expect(fetched.id).toBe(movement.id);
  });

  it("isolates shipment fulfillment by store", async () => {
    const module = createMemoryShipmentFulfillmentModule();
    const { shipment } = await seedPackedShipmentWithAllocations(module);

    await expect(
      module.fulfillmentService.fulfillShipment(
        { storeId: TEST_STORE_B_ID },
        shipment.id,
      ),
    ).rejects.toMatchObject({
      code: FULFILLMENT_ERROR_CODES.SHIPMENT_NOT_FOUND,
      status: 404,
    });
  });

  it("rolls back when repository fulfillment fails", async () => {
    const module = createMemoryShipmentFulfillmentModule();
    const { shipment, inventoryItem } =
      await seedPackedShipmentWithAllocations(module);

    module.fulfillmentRepository.setTransactionFailure(
      new Error("FULFILLMENT_ROLLBACK"),
    );

    await expect(
      module.fulfillmentService.fulfillShipment(
        { storeId: TEST_STORE_A_ID },
        shipment.id,
      ),
    ).rejects.toMatchObject({
      code: FULFILLMENT_ERROR_CODES.TRANSACTION_FAILED,
      status: 500,
    });

    const inventory = await module.inventoryItemRepository.findById(
      TEST_STORE_A_ID,
      inventoryItem.id,
    );

    expect(inventory?.quantityOnHand).toBe(8);
  });
});
