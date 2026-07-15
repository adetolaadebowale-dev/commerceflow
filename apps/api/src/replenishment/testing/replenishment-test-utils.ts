import type { CreateReplenishmentRuleInput } from "@commerceflow/validation";

import type { DomainEventPublisher } from "@/domain-events";
import { MemoryReplenishmentRepository } from "../repositories/memory-replenishment.repository";
import { ReplenishmentService } from "../services/replenishment.service";
import {
  createMemoryPurchaseOrderModule,
  TEST_STORE_A_ID,
  TEST_STORE_B_ID,
  TEST_SUPPLIER_A_ID,
} from "@/purchase-orders/testing/purchase-order-test-utils";
import { seedInventoryItemForAdjustments } from "@/inventory-adjustments/testing/inventory-adjustment-test-utils";
import { TEST_VARIANT_A_ID } from "@/reservations/testing/reservation-test-utils";

export { TEST_STORE_A_ID, TEST_STORE_B_ID, TEST_SUPPLIER_A_ID };

export function createMemoryReplenishmentModule(
  options: {
    domainEventPublisher?: DomainEventPublisher;
  } = {},
) {
  const purchaseOrderModule = createMemoryPurchaseOrderModule(options);
  const replenishmentRepository = new MemoryReplenishmentRepository(
    purchaseOrderModule.inventoryItemRepository,
    purchaseOrderModule.purchaseOrderRepository,
  );

  return {
    ...purchaseOrderModule,
    replenishmentRepository,
    replenishmentService: new ReplenishmentService({
      replenishmentRepository,
      warehouseRepository: purchaseOrderModule.warehouseRepository,
      supplierRepository: purchaseOrderModule.supplierRepository,
      inventoryItemRepository: purchaseOrderModule.inventoryItemRepository,
      domainEventPublisher: options.domainEventPublisher,
    }),
  };
}

export function validReplenishmentRuleInput(
  overrides: Partial<CreateReplenishmentRuleInput> = {},
): CreateReplenishmentRuleInput {
  return {
    storeId: TEST_STORE_A_ID,
    warehouseId: "00000000-0000-0000-0000-000000000001",
    productVariantId: TEST_VARIANT_A_ID,
    supplierId: TEST_SUPPLIER_A_ID,
    reorderPoint: 10,
    reorderQuantity: 25,
    isEnabled: true,
    ...overrides,
  };
}

export async function seedReplenishmentRule(
  module: ReturnType<typeof createMemoryReplenishmentModule>,
  overrides: Partial<CreateReplenishmentRuleInput> = {},
) {
  const { inventoryItem } = await seedInventoryItemForAdjustments(module, {
    variantId: overrides.productVariantId ?? TEST_VARIANT_A_ID,
    initialQuantity: 0,
  });

  const rule = await module.replenishmentService.createRule(
    validReplenishmentRuleInput({
      warehouseId: inventoryItem.warehouseId,
      productVariantId: inventoryItem.productVariantId,
      ...overrides,
    }),
  );

  return { inventoryItem, rule };
}

export async function seedPendingRecommendation(
  module: ReturnType<typeof createMemoryReplenishmentModule>,
  options: {
    initialQuantity?: number;
    reorderPoint?: number;
    reorderQuantity?: number;
  } = {},
) {
  const { inventoryItem, rule } = await seedReplenishmentRule(module, {
    reorderPoint: options.reorderPoint ?? 10,
    reorderQuantity: options.reorderQuantity ?? 25,
  });

  if ((options.initialQuantity ?? 0) > 0) {
    await module.inventoryItemRepository.adjustStock({
      storeId: TEST_STORE_A_ID,
      inventoryItemId: inventoryItem.id,
      quantityChange: options.initialQuantity ?? 0,
      reason: "manual_adjustment",
    });
  }

  const recommendations =
    await module.replenishmentService.generateRecommendations({
      storeId: TEST_STORE_A_ID,
    });

  return {
    inventoryItem,
    rule,
    recommendation: recommendations[0]!,
  };
}
