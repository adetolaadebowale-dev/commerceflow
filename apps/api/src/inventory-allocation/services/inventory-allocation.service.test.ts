import { describe, expect, it } from "vitest";

import { INVENTORY_ALLOCATION_ERROR_CODES } from "../errors";
import {
  createMemoryInventoryAllocationModule,
  seedPendingPickListWithInventory,
  seedPickingAllocation,
  TEST_STORE_A_ID,
  TEST_STORE_B_ID,
} from "../testing/inventory-allocation-test-utils";

describe("InventoryAllocationService", () => {
  it("allocates inventory to a pick list item", async () => {
    const module = createMemoryInventoryAllocationModule();
    const { pickListItem, allocation, inventoryItem } =
      await seedPickingAllocation(module);

    expect(allocation.pickListItemId).toBe(pickListItem.id);
    expect(allocation.inventoryItemId).toBe(inventoryItem.id);
    expect(allocation.quantityAllocated).toBe(pickListItem.quantityRequired);
    expect(allocation.quantityPicked).toBe(0);
    expect(allocation.status).toBe("allocated");
  });

  it("rejects allocation when inventory is insufficient", async () => {
    const module = createMemoryInventoryAllocationModule();
    const { pickList, inventoryItem } = await seedPendingPickListWithInventory(
      module,
      { initialQuantity: 2, orderQuantity: 2 },
    );

    await module.pickListService.startPicking(TEST_STORE_A_ID, pickList.id);

    await expect(
      module.inventoryAllocationService.allocateInventory(
        TEST_STORE_A_ID,
        pickList.items[0]!.id,
        {
          inventoryItemId: inventoryItem.id,
          quantityAllocated: 1,
        },
      ),
    ).rejects.toMatchObject({
      code: INVENTORY_ALLOCATION_ERROR_CODES.INSUFFICIENT_INVENTORY,
      status: 409,
    });
  });

  it("supports partial picking and syncs pick list item quantities", async () => {
    const module = createMemoryInventoryAllocationModule();
    const { allocation, pickListItem } = await seedPickingAllocation(module, {
      quantityAllocated: 4,
      orderQuantity: 4,
    });

    const updated = await module.inventoryAllocationService.updatePickedQuantity(
      TEST_STORE_A_ID,
      allocation.id,
      { quantityPicked: 2 },
    );

    expect(updated.status).toBe("partially_picked");
    expect(updated.quantityPicked).toBe(2);

    const context = await module.pickListRepository.findItemById(
      TEST_STORE_A_ID,
      pickListItem.id,
    );

    expect(context?.item.quantityPicked).toBe(2);
  });

  it("transitions allocation to picked when fully picked", async () => {
    const module = createMemoryInventoryAllocationModule();
    const { allocation } = await seedPickingAllocation(module);

    const updated = await module.inventoryAllocationService.updatePickedQuantity(
      TEST_STORE_A_ID,
      allocation.id,
      { quantityPicked: allocation.quantityAllocated },
    );

    expect(updated.status).toBe("picked");
  });

  it("reports a shortage and marks allocation immutable", async () => {
    const module = createMemoryInventoryAllocationModule();
    const { allocation } = await seedPickingAllocation(module);

    const shortage = await module.inventoryAllocationService.reportShortage(
      TEST_STORE_A_ID,
      allocation.id,
      { shortageReason: "Bin empty" },
    );

    expect(shortage.status).toBe("shortage");
    expect(shortage.shortageReason).toBe("Bin empty");

    await expect(
      module.inventoryAllocationService.updatePickedQuantity(
        TEST_STORE_A_ID,
        allocation.id,
        { quantityPicked: 1 },
      ),
    ).rejects.toMatchObject({
      code: INVENTORY_ALLOCATION_ERROR_CODES.ALLOCATION_IMMUTABLE,
      status: 409,
    });
  });

  it("rejects picked quantity above allocated quantity", async () => {
    const module = createMemoryInventoryAllocationModule();
    const { allocation } = await seedPickingAllocation(module);

    await expect(
      module.inventoryAllocationService.updatePickedQuantity(
        TEST_STORE_A_ID,
        allocation.id,
        { quantityPicked: allocation.quantityAllocated + 1 },
      ),
    ).rejects.toMatchObject({
      code: INVENTORY_ALLOCATION_ERROR_CODES.QUANTITY_EXCEEDED,
      status: 400,
    });
  });

  it("isolates allocations by store", async () => {
    const module = createMemoryInventoryAllocationModule();
    const { allocation } = await seedPickingAllocation(module);

    await expect(
      module.inventoryAllocationService.getAllocation(
        TEST_STORE_B_ID,
        allocation.id,
      ),
    ).rejects.toMatchObject({
      code: INVENTORY_ALLOCATION_ERROR_CODES.ALLOCATION_NOT_FOUND,
      status: 404,
    });
  });

  it("rejects allocation for delivered shipments", async () => {
    const module = createMemoryInventoryAllocationModule();
    const { pickList, inventoryItem, shipment } =
      await seedPendingPickListWithInventory(module);

    await module.shipmentService.packShipment(
      { storeId: TEST_STORE_A_ID },
      shipment.id,
    );
    await module.shipmentService.shipShipment(
      { storeId: TEST_STORE_A_ID },
      shipment.id,
    );
    await module.shipmentService.deliverShipment(
      { storeId: TEST_STORE_A_ID },
      shipment.id,
    );

    await expect(
      module.inventoryAllocationService.allocateInventory(
        TEST_STORE_A_ID,
        pickList.items[0]!.id,
        {
          inventoryItemId: inventoryItem.id,
          quantityAllocated: 1,
        },
      ),
    ).rejects.toMatchObject({
      code: INVENTORY_ALLOCATION_ERROR_CODES.SHIPMENT_NOT_ELIGIBLE,
      status: 409,
    });
  });

  it("rolls back when repository create fails", async () => {
    const module = createMemoryInventoryAllocationModule();
    const { pickList, inventoryItem } = await seedPendingPickListWithInventory(
      module,
    );

    await module.pickListService.startPicking(TEST_STORE_A_ID, pickList.id);

    module.inventoryAllocationRepository.setTransactionFailure(
      new Error("ALLOCATION_CREATE_FAILED"),
    );

    await expect(
      module.inventoryAllocationService.allocateInventory(
        TEST_STORE_A_ID,
        pickList.items[0]!.id,
        {
          inventoryItemId: inventoryItem.id,
          quantityAllocated: 1,
        },
      ),
    ).rejects.toMatchObject({
      code: INVENTORY_ALLOCATION_ERROR_CODES.TRANSACTION_FAILED,
      status: 500,
    });
  });
});

describe("InventoryAllocationService delivered shipment guard", () => {
  it("rejects updates when parent shipment was delivered", async () => {
    const module = createMemoryInventoryAllocationModule();
    const { allocation, shipment } = await seedPickingAllocation(module);

    await module.shipmentService.packShipment(
      { storeId: TEST_STORE_A_ID },
      shipment.id,
    );
    await module.shipmentService.shipShipment(
      { storeId: TEST_STORE_A_ID },
      shipment.id,
    );
    await module.shipmentService.deliverShipment(
      { storeId: TEST_STORE_A_ID },
      shipment.id,
    );

    await expect(
      module.inventoryAllocationService.updatePickedQuantity(
        TEST_STORE_A_ID,
        allocation.id,
        { quantityPicked: 1 },
      ),
    ).rejects.toMatchObject({
      code: INVENTORY_ALLOCATION_ERROR_CODES.SHIPMENT_NOT_ELIGIBLE,
      status: 409,
    });
  });
});
