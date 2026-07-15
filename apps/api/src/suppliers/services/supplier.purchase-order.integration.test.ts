import { describe, expect, it } from "vitest";

import { PURCHASE_ORDER_ERROR_CODES } from "@/purchase-orders/errors";
import {
  createMemoryPurchaseOrderModule,
  seedDraftPurchaseOrder,
  TEST_STORE_A_ID,
  TEST_SUPPLIER_A_ID,
} from "@/purchase-orders/testing/purchase-order-test-utils";
import { seedInventoryItemForAdjustments } from "@/inventory-adjustments/testing/inventory-adjustment-test-utils";
import { TEST_VARIANT_A_ID } from "@/reservations/testing/reservation-test-utils";

describe("Supplier purchase order integration", () => {
  it("allows purchase orders for active suppliers", async () => {
    const module = createMemoryPurchaseOrderModule();
    const { purchaseOrder } = await seedDraftPurchaseOrder(module);

    expect(purchaseOrder.supplierId).toBe(TEST_SUPPLIER_A_ID);
  });

  it("rejects new purchase orders for inactive suppliers", async () => {
    const module = createMemoryPurchaseOrderModule();
    const { inventoryItem } = await seedInventoryItemForAdjustments(module, {
      variantId: TEST_VARIANT_A_ID,
      initialQuantity: 0,
    });

    module.supplierRepository.seedSupplier({
      id: TEST_SUPPLIER_A_ID,
      storeId: TEST_STORE_A_ID,
      code: "INACTIVE",
      name: "Inactive Supplier",
      status: "inactive",
    });

    await expect(
      module.purchaseOrderService.createPurchaseOrder({
        storeId: TEST_STORE_A_ID,
        warehouseId: inventoryItem.warehouseId,
        supplierId: TEST_SUPPLIER_A_ID,
        items: [
          {
            productVariantId: inventoryItem.productVariantId,
            quantityOrdered: 5,
            unitCost: "10.00",
            currency: "USD",
          },
        ],
      }),
    ).rejects.toMatchObject({
      code: PURCHASE_ORDER_ERROR_CODES.VALIDATION_ERROR,
      status: 400,
    });
  });

  it("keeps existing purchase orders valid after supplier deactivation", async () => {
    const module = createMemoryPurchaseOrderModule();
    const { purchaseOrder } = await seedDraftPurchaseOrder(module);

    module.supplierRepository.seedSupplier({
      id: TEST_SUPPLIER_A_ID,
      storeId: TEST_STORE_A_ID,
      code: "ACME",
      name: "Acme Supplies",
      status: "inactive",
    });

    const fetched = await module.purchaseOrderService.getPurchaseOrder(
      { storeId: TEST_STORE_A_ID },
      purchaseOrder.id,
    );

    expect(fetched.id).toBe(purchaseOrder.id);
    expect(fetched.supplierId).toBe(TEST_SUPPLIER_A_ID);
  });

  it("rejects purchase orders for soft-deleted suppliers", async () => {
    const module = createMemoryPurchaseOrderModule();
    const { inventoryItem } = await seedInventoryItemForAdjustments(module, {
      variantId: TEST_VARIANT_A_ID,
      initialQuantity: 0,
    });

    await module.supplierRepository.softDelete(
      TEST_STORE_A_ID,
      TEST_SUPPLIER_A_ID,
    );

    await expect(
      module.purchaseOrderService.createPurchaseOrder({
        storeId: TEST_STORE_A_ID,
        warehouseId: inventoryItem.warehouseId,
        supplierId: TEST_SUPPLIER_A_ID,
        items: [
          {
            productVariantId: inventoryItem.productVariantId,
            quantityOrdered: 5,
            unitCost: "10.00",
            currency: "USD",
          },
        ],
      }),
    ).rejects.toMatchObject({
      code: PURCHASE_ORDER_ERROR_CODES.SUPPLIER_NOT_FOUND,
      status: 404,
    });
  });
});
