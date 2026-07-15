import type { DomainEventPublisher } from "@/domain-events";
import { MemoryInventoryAdjustmentRepository } from "../repositories/memory-inventory-adjustment.repository";
import { InventoryAdjustmentService } from "../services/inventory-adjustment.service";
import {
  createMemoryReservationService,
  seedConfirmedOrderWithInventory,
  TEST_STORE_A_ID,
  TEST_STORE_B_ID,
  TEST_VARIANT_A_ID,
  TEST_VARIANT_B_ID,
} from "../../reservations/testing/reservation-test-utils";

export { TEST_STORE_A_ID, TEST_STORE_B_ID };

export type MemoryInventoryAdjustmentModule = ReturnType<
  typeof createMemoryInventoryAdjustmentModule
>;

export function createMemoryInventoryAdjustmentModule(
  dependencies: {
    domainEventPublisher?: DomainEventPublisher;
  } = {},
) {
  const reservationServices = createMemoryReservationService();
  const inventoryAdjustmentRepository = new MemoryInventoryAdjustmentRepository(
    reservationServices.inventoryItemRepository,
  );

  return {
    ...reservationServices,
    inventoryAdjustmentRepository,
    inventoryAdjustmentService: new InventoryAdjustmentService({
      inventoryAdjustmentRepository,
      inventoryItemRepository: reservationServices.inventoryItemRepository,
      ...dependencies,
    }),
  };
}

export async function seedInventoryItemForAdjustments(
  module: MemoryInventoryAdjustmentModule,
  options: {
    storeId?: string;
    variantId?: string;
    initialQuantity?: number;
  } = {},
) {
  const storeId = options.storeId ?? TEST_STORE_A_ID;
  const variantId = options.variantId ?? TEST_VARIANT_A_ID;
  const initialQuantity = options.initialQuantity ?? 10;

  const seeded = await seedConfirmedOrderWithInventory(module, {
    storeId,
    variantId,
    initialQuantity,
    orderQuantity: 1,
  });

  return {
    inventoryItem: seeded.inventoryItem,
    order: seeded.confirmed,
  };
}

export async function seedSecondStoreInventoryItem(
  module: MemoryInventoryAdjustmentModule,
) {
  return seedInventoryItemForAdjustments(module, {
    storeId: TEST_STORE_B_ID,
    variantId: TEST_VARIANT_B_ID,
    initialQuantity: 5,
  });
}
