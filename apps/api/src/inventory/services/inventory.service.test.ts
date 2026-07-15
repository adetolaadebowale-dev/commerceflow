import { describe, expect, it, beforeAll } from "vitest";

import { INVENTORY_ERROR_CODES } from "../errors";
import {
  createMemoryInventoryService,
  seedTestWarehouse,
  TEST_STORE_A_ID,
  TEST_STORE_B_ID,
  TEST_VARIANT_A_ID,
  TEST_VARIANT_B_ID,
  validInventoryItemInput,
  validStockMovementInput,
} from "../testing/inventory-test-utils";

function seedVariant(
  inventoryItemRepository: ReturnType<
    typeof createMemoryInventoryService
  >["inventoryItemRepository"],
  storeId: string,
  productVariantId: string,
): void {
  inventoryItemRepository.seedProductVariant(storeId, productVariantId);
}

describe("InventoryService", () => {
  beforeAll(async () => {
    const services = createMemoryInventoryService();
    await seedTestWarehouse(services);
  });

  it("creates inventory with an initial stock movement", async () => {
    const { inventoryService, inventoryItemRepository } =
      createMemoryInventoryService();
    seedVariant(inventoryItemRepository, TEST_STORE_A_ID, TEST_VARIANT_A_ID);

    const result = await inventoryService.createInventoryItem(
      validInventoryItemInput(TEST_VARIANT_A_ID, { initialQuantity: 25 }),
    );

    expect(result.inventoryItem.quantityOnHand).toBe(25);
    expect(result.stockMovement.movementType).toBe("adjustment");
    expect(result.stockMovement.quantity).toBe(25);
    expect(result.stockMovement.previousQuantityOnHand).toBe(0);
    expect(result.stockMovement.newQuantityOnHand).toBe(25);
  });

  it("increases stock and records a movement", async () => {
    const { inventoryService, inventoryItemRepository } =
      createMemoryInventoryService();
    seedVariant(inventoryItemRepository, TEST_STORE_A_ID, TEST_VARIANT_A_ID);

    const created = await inventoryService.createInventoryItem(
      validInventoryItemInput(TEST_VARIANT_A_ID),
    );

    const adjusted = await inventoryService.adjustStock(
      validStockMovementInput(created.inventoryItem.id, {
        quantityChange: 7,
        reason: "manual_adjustment",
      }),
    );

    expect(adjusted.inventoryItem.quantityOnHand).toBe(17);
    expect(adjusted.stockMovement.quantity).toBe(7);
    expect(adjusted.stockMovement.newQuantityOnHand).toBe(17);
  });

  it("decreases stock and records a movement", async () => {
    const { inventoryService, inventoryItemRepository } =
      createMemoryInventoryService();
    seedVariant(inventoryItemRepository, TEST_STORE_A_ID, TEST_VARIANT_A_ID);

    const created = await inventoryService.createInventoryItem(
      validInventoryItemInput(TEST_VARIANT_A_ID, { initialQuantity: 20 }),
    );

    const adjusted = await inventoryService.adjustStock(
      validStockMovementInput(created.inventoryItem.id, {
        quantityChange: -8,
        reason: "sale_reserved_ready",
      }),
    );

    expect(adjusted.inventoryItem.quantityOnHand).toBe(12);
    expect(adjusted.stockMovement.quantity).toBe(-8);
    expect(adjusted.stockMovement.newQuantityOnHand).toBe(12);
  });

  it("prevents stock from becoming negative", async () => {
    const { inventoryService, inventoryItemRepository } =
      createMemoryInventoryService();
    seedVariant(inventoryItemRepository, TEST_STORE_A_ID, TEST_VARIANT_A_ID);

    const created = await inventoryService.createInventoryItem(
      validInventoryItemInput(TEST_VARIANT_A_ID, { initialQuantity: 5 }),
    );

    await expect(
      inventoryService.adjustStock(
        validStockMovementInput(created.inventoryItem.id, {
          quantityChange: -6,
        }),
      ),
    ).rejects.toMatchObject({
      code: INVENTORY_ERROR_CODES.INSUFFICIENT_STOCK,
      status: 409,
    });

    const fetched = await inventoryService.getInventoryItem(
      TEST_STORE_A_ID,
      created.inventoryItem.id,
    );
    expect(fetched.quantityOnHand).toBe(5);
  });

  it("rejects duplicate inventory for the same variant", async () => {
    const { inventoryService, inventoryItemRepository } =
      createMemoryInventoryService();
    seedVariant(inventoryItemRepository, TEST_STORE_A_ID, TEST_VARIANT_A_ID);

    await inventoryService.createInventoryItem(
      validInventoryItemInput(TEST_VARIANT_A_ID),
    );

    await expect(
      inventoryService.createInventoryItem(
        validInventoryItemInput(TEST_VARIANT_A_ID),
      ),
    ).rejects.toMatchObject({
      code: INVENTORY_ERROR_CODES.ALREADY_EXISTS,
      status: 409,
    });
  });

  it("rejects inventory for unknown product variants", async () => {
    const { inventoryService } = createMemoryInventoryService();

    await expect(
      inventoryService.createInventoryItem(
        validInventoryItemInput("00000000-0000-0000-0000-000000000099"),
      ),
    ).rejects.toMatchObject({
      code: INVENTORY_ERROR_CODES.VARIANT_NOT_FOUND,
      status: 404,
    });
  });

  it("lists stock movements for an inventory item", async () => {
    const { inventoryService, inventoryItemRepository } =
      createMemoryInventoryService();
    seedVariant(inventoryItemRepository, TEST_STORE_A_ID, TEST_VARIANT_A_ID);

    const created = await inventoryService.createInventoryItem(
      validInventoryItemInput(TEST_VARIANT_A_ID),
    );

    await inventoryService.adjustStock(
      validStockMovementInput(created.inventoryItem.id, { quantityChange: 3 }),
    );

    const movements = await inventoryService.listStockMovements({
      storeId: TEST_STORE_A_ID,
      inventoryItemId: created.inventoryItem.id,
      page: 1,
      limit: 20,
    });

    expect(movements.items).toHaveLength(2);
    expect(movements.totalPages).toBe(1);
  });

  it("rolls back inventory creation when the transaction fails", async () => {
    const { inventoryService, inventoryItemRepository } =
      createMemoryInventoryService();
    seedVariant(inventoryItemRepository, TEST_STORE_A_ID, TEST_VARIANT_A_ID);
    inventoryItemRepository.setTransactionFailure(
      new Error("simulated transaction failure"),
    );

    await expect(
      inventoryService.createInventoryItem(
        validInventoryItemInput(TEST_VARIANT_A_ID),
      ),
    ).rejects.toThrow("simulated transaction failure");

    expect(inventoryItemRepository.getItemCount()).toBe(0);
    expect(inventoryItemRepository.getAllMovements()).toHaveLength(0);
  });

  it("rolls back stock adjustments when the transaction fails", async () => {
    const { inventoryService, inventoryItemRepository } =
      createMemoryInventoryService();
    seedVariant(inventoryItemRepository, TEST_STORE_A_ID, TEST_VARIANT_A_ID);

    const created = await inventoryService.createInventoryItem(
      validInventoryItemInput(TEST_VARIANT_A_ID, { initialQuantity: 10 }),
    );

    inventoryItemRepository.setTransactionFailure(
      new Error("simulated transaction failure"),
    );

    await expect(
      inventoryService.adjustStock(
        validStockMovementInput(created.inventoryItem.id, { quantityChange: 4 }),
      ),
    ).rejects.toThrow("simulated transaction failure");

    const fetched = await inventoryService.getInventoryItem(
      TEST_STORE_A_ID,
      created.inventoryItem.id,
    );
    expect(fetched.quantityOnHand).toBe(10);
    expect(inventoryItemRepository.getAllMovements()).toHaveLength(1);
  });

  it("hides soft-deleted inventory items from get and list", async () => {
    const { inventoryService, inventoryItemRepository } =
      createMemoryInventoryService();
    seedVariant(inventoryItemRepository, TEST_STORE_A_ID, TEST_VARIANT_A_ID);

    const created = await inventoryService.createInventoryItem(
      validInventoryItemInput(TEST_VARIANT_A_ID),
    );

    inventoryItemRepository.softDelete(created.inventoryItem.id);

    await expect(
      inventoryService.getInventoryItem(
        TEST_STORE_A_ID,
        created.inventoryItem.id,
      ),
    ).rejects.toMatchObject({
      code: INVENTORY_ERROR_CODES.NOT_FOUND,
      status: 404,
    });

    const listed = await inventoryService.listInventoryItems({
      storeId: TEST_STORE_A_ID,
      page: 1,
      limit: 20,
    });
    expect(listed.items).toHaveLength(0);
  });

  it("isolates inventory by store", async () => {
    const { inventoryService, inventoryItemRepository } =
      createMemoryInventoryService();
    seedVariant(inventoryItemRepository, TEST_STORE_A_ID, TEST_VARIANT_A_ID);
    seedVariant(inventoryItemRepository, TEST_STORE_B_ID, TEST_VARIANT_B_ID);

    const created = await inventoryService.createInventoryItem(
      validInventoryItemInput(TEST_VARIANT_A_ID),
    );

    await expect(
      inventoryService.getInventoryItem(
        TEST_STORE_B_ID,
        created.inventoryItem.id,
      ),
    ).rejects.toMatchObject({
      code: INVENTORY_ERROR_CODES.NOT_FOUND,
      status: 404,
    });

    await expect(
      inventoryService.adjustStock(
        validStockMovementInput(created.inventoryItem.id, {
          storeId: TEST_STORE_B_ID,
        }),
      ),
    ).rejects.toMatchObject({
      code: INVENTORY_ERROR_CODES.NOT_FOUND,
      status: 404,
    });
  });

  it("paginates inventory item lists", async () => {
    const { inventoryService, inventoryItemRepository } =
      createMemoryInventoryService();

    for (let index = 0; index < 5; index += 1) {
      const variantId = `cccccccc-cccc-cccc-cccc-${String(index).padStart(12, "0")}`;
      seedVariant(inventoryItemRepository, TEST_STORE_A_ID, variantId);
      await inventoryService.createInventoryItem(
        validInventoryItemInput(variantId, { initialQuantity: index }),
      );
    }

    const pageTwo = await inventoryService.listInventoryItems({
      storeId: TEST_STORE_A_ID,
      page: 2,
      limit: 2,
    });

    expect(pageTwo.items).toHaveLength(2);
    expect(pageTwo.total).toBe(5);
    expect(pageTwo.totalPages).toBe(3);
  });
});
