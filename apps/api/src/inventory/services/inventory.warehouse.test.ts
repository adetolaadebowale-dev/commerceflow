import { describe, expect, it } from "vitest";

import { INVENTORY_ERROR_CODES } from "../errors";
import {
  createMemoryInventoryService,
  seedTestWarehouse,
  TEST_STORE_A_ID,
  TEST_VARIANT_A_ID,
  validInventoryItemInput,
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

describe("InventoryService warehouse awareness", () => {
  it("requires a valid active warehouse when creating inventory", async () => {
    const services = createMemoryInventoryService();
    const warehouseId = await seedTestWarehouse(services);
    seedVariant(services.inventoryItemRepository, TEST_STORE_A_ID, TEST_VARIANT_A_ID);

    await expect(
      services.inventoryService.createInventoryItem(
        validInventoryItemInput(TEST_VARIANT_A_ID, {
          warehouseId: "00000000-0000-0000-0000-000000000099",
        }),
      ),
    ).rejects.toMatchObject({
      code: INVENTORY_ERROR_CODES.WAREHOUSE_NOT_FOUND,
      status: 404,
    });

    const result = await services.inventoryService.createInventoryItem(
      validInventoryItemInput(TEST_VARIANT_A_ID, { warehouseId }),
    );

    expect(result.inventoryItem.warehouseId).toBe(warehouseId);
    expect(result.stockMovement.warehouseId).toBe(warehouseId);
  });
});
