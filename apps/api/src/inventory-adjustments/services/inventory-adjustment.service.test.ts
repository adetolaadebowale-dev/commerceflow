import { describe, expect, it } from "vitest";

import { INVENTORY_ADJUSTMENT_ERROR_CODES } from "../errors";
import {
  createMemoryInventoryAdjustmentModule,
  seedInventoryItemForAdjustments,
  seedSecondStoreInventoryItem,
  TEST_STORE_A_ID,
  TEST_STORE_B_ID,
} from "../testing/inventory-adjustment-test-utils";

const TEST_USER_ID = "99999999-9999-9999-9999-999999999999";

describe("InventoryAdjustmentService", () => {
  it("creates a positive adjustment and updates quantity on hand", async () => {
    const module = createMemoryInventoryAdjustmentModule();
    const { inventoryItem } = await seedInventoryItemForAdjustments(module, {
      initialQuantity: 10,
    });

    const result = await module.inventoryAdjustmentService.createAdjustment(
      {
        storeId: TEST_STORE_A_ID,
        inventoryItemId: inventoryItem.id,
        movementQuantity: 5,
        reason: "Found stock in back room",
      },
      TEST_USER_ID,
    );

    expect(result.adjustment.adjustmentNumber).toMatch(/^ADJ-/);
    expect(result.adjustment.movementQuantity).toBe(5);
    expect(result.adjustment.previousQuantityOnHand).toBe(10);
    expect(result.adjustment.newQuantityOnHand).toBe(15);
    expect(result.stockMovement).toMatchObject({
      movementType: "adjustment",
      quantity: 5,
    });

    const updated = await module.inventoryItemRepository.findById(
      TEST_STORE_A_ID,
      inventoryItem.id,
    );

    expect(updated?.quantityOnHand).toBe(15);
  });

  it("creates a negative adjustment when stock is sufficient", async () => {
    const module = createMemoryInventoryAdjustmentModule();
    const { inventoryItem } = await seedInventoryItemForAdjustments(module, {
      initialQuantity: 10,
    });

    const result = await module.inventoryAdjustmentService.createAdjustment(
      {
        storeId: TEST_STORE_A_ID,
        inventoryItemId: inventoryItem.id,
        movementQuantity: -3,
        reason: "Damaged units removed",
      },
      TEST_USER_ID,
    );

    expect(result.adjustment.newQuantityOnHand).toBe(7);
    expect(result.stockMovement.quantity).toBe(-3);
  });

  it("rejects negative adjustments that would drop below zero", async () => {
    const module = createMemoryInventoryAdjustmentModule();
    const { inventoryItem } = await seedInventoryItemForAdjustments(module, {
      initialQuantity: 2,
    });

    await expect(
      module.inventoryAdjustmentService.createAdjustment(
        {
          storeId: TEST_STORE_A_ID,
          inventoryItemId: inventoryItem.id,
          movementQuantity: -5,
          reason: "Over-adjustment",
        },
        TEST_USER_ID,
      ),
    ).rejects.toMatchObject({
      code: INVENTORY_ADJUSTMENT_ERROR_CODES.INSUFFICIENT_STOCK,
      status: 409,
    });
  });

  it("enforces tenant isolation on get", async () => {
    const module = createMemoryInventoryAdjustmentModule();
    const storeA = await seedInventoryItemForAdjustments(module);
    const storeB = await seedSecondStoreInventoryItem(module);

    const result = await module.inventoryAdjustmentService.createAdjustment(
      {
        storeId: TEST_STORE_A_ID,
        inventoryItemId: storeA.inventoryItem.id,
        movementQuantity: 1,
        reason: "Store A adjustment",
      },
      TEST_USER_ID,
    );

    await expect(
      module.inventoryAdjustmentService.getAdjustment(
        { storeId: TEST_STORE_B_ID },
        result.adjustment.id,
      ),
    ).rejects.toMatchObject({
      code: INVENTORY_ADJUSTMENT_ERROR_CODES.ADJUSTMENT_NOT_FOUND,
      status: 404,
    });

    await expect(
      module.inventoryAdjustmentService.createAdjustment(
        {
          storeId: TEST_STORE_B_ID,
          inventoryItemId: storeA.inventoryItem.id,
          movementQuantity: 1,
          reason: "Cross-store attempt",
        },
        TEST_USER_ID,
      ),
    ).rejects.toMatchObject({
      code: INVENTORY_ADJUSTMENT_ERROR_CODES.INVENTORY_ITEM_NOT_FOUND,
      status: 404,
    });

    expect(storeB.inventoryItem.storeId).toBe(TEST_STORE_B_ID);
  });

  it("rolls back when the repository transaction fails", async () => {
    const module = createMemoryInventoryAdjustmentModule();
    const { inventoryItem } = await seedInventoryItemForAdjustments(module, {
      initialQuantity: 10,
    });

    module.inventoryAdjustmentRepository.setTransactionFailure(
      new Error("TRANSACTION_FAILED"),
    );

    await expect(
      module.inventoryAdjustmentService.createAdjustment(
        {
          storeId: TEST_STORE_A_ID,
          inventoryItemId: inventoryItem.id,
          movementQuantity: 2,
          reason: "Should rollback",
        },
        TEST_USER_ID,
      ),
    ).rejects.toMatchObject({
      code: INVENTORY_ADJUSTMENT_ERROR_CODES.TRANSACTION_FAILED,
      status: 500,
    });

    const unchanged = await module.inventoryItemRepository.findById(
      TEST_STORE_A_ID,
      inventoryItem.id,
    );

    expect(unchanged?.quantityOnHand).toBe(10);
  });
});
