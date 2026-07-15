import type { DomainEventPublisher } from "@/domain-events";
import { MemoryPurchaseOrderRepository } from "../repositories/memory-purchase-order.repository";
import { MemorySupplierRepository } from "../repositories/memory-supplier.repository";
import { PurchaseOrderService } from "../services/purchase-order.service";
import {
  createMemoryInventoryAdjustmentModule,
  seedInventoryItemForAdjustments,
  TEST_STORE_A_ID,
  TEST_STORE_B_ID,
} from "../../inventory-adjustments/testing/inventory-adjustment-test-utils";
import { TEST_VARIANT_A_ID } from "../../reservations/testing/reservation-test-utils";

export { TEST_STORE_A_ID, TEST_STORE_B_ID };

export const TEST_SUPPLIER_A_ID = "dddddddd-dddd-dddd-dddd-dddddddddddd";

export type MemoryPurchaseOrderModule = ReturnType<
  typeof createMemoryPurchaseOrderModule
>;

export function createMemoryPurchaseOrderModule(
  dependencies: {
    domainEventPublisher?: DomainEventPublisher;
  } = {},
) {
  const adjustmentModule = createMemoryInventoryAdjustmentModule(dependencies);
  const supplierRepository = new MemorySupplierRepository();
  const purchaseOrderRepository = new MemoryPurchaseOrderRepository(
    adjustmentModule.inventoryItemRepository,
  );

  supplierRepository.seedSupplier({
    id: TEST_SUPPLIER_A_ID,
    storeId: TEST_STORE_A_ID,
    name: "Acme Supplies",
    code: "ACME",
    status: "active",
  });

  return {
    ...adjustmentModule,
    supplierRepository,
    purchaseOrderRepository,
    purchaseOrderService: new PurchaseOrderService({
      purchaseOrderRepository,
      supplierRepository,
      inventoryItemRepository: adjustmentModule.inventoryItemRepository,
      warehouseRepository: adjustmentModule.warehouseRepository,
      ...dependencies,
    }),
  };
}

export async function seedDraftPurchaseOrder(
  module: MemoryPurchaseOrderModule,
  options: {
    quantityOrdered?: number;
    variantId?: string;
  } = {},
) {
  const { inventoryItem } = await seedInventoryItemForAdjustments(module, {
    variantId: options.variantId ?? TEST_VARIANT_A_ID,
    initialQuantity: 0,
  });

  const purchaseOrder = await module.purchaseOrderService.createPurchaseOrder({
    storeId: TEST_STORE_A_ID,
    warehouseId: inventoryItem.warehouseId,
    supplierId: TEST_SUPPLIER_A_ID,
    items: [
      {
        productVariantId: inventoryItem.productVariantId,
        quantityOrdered: options.quantityOrdered ?? 10,
        unitCost: "12.50",
        currency: "USD",
      },
    ],
  });

  return { inventoryItem, purchaseOrder };
}

export async function seedApprovedPurchaseOrder(
  module: MemoryPurchaseOrderModule,
  options: { quantityOrdered?: number } = {},
) {
  const seeded = await seedDraftPurchaseOrder(module, options);

  const purchaseOrder = await module.purchaseOrderService.approvePurchaseOrder(
    seeded.purchaseOrder.id,
    { storeId: TEST_STORE_A_ID },
  );

  return { ...seeded, purchaseOrder };
}

export async function seedOrderedPurchaseOrder(
  module: MemoryPurchaseOrderModule,
  options: { quantityOrdered?: number } = {},
) {
  const seeded = await seedApprovedPurchaseOrder(module, options);

  const purchaseOrder = await module.purchaseOrderService.orderPurchaseOrder(
    seeded.purchaseOrder.id,
    { storeId: TEST_STORE_A_ID },
  );

  return { ...seeded, purchaseOrder };
}
