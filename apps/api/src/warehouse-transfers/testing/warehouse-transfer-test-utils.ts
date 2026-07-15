import type { DomainEventPublisher } from "@/domain-events";
import { MemoryWarehouseTransferRepository } from "../repositories/memory-warehouse-transfer.repository";
import { WarehouseTransferService } from "../services/warehouse-transfer.service";
import {
  createMemoryInventoryAdjustmentModule,
  seedInventoryItemForAdjustments,
  TEST_STORE_A_ID,
  TEST_STORE_B_ID,
} from "../../inventory-adjustments/testing/inventory-adjustment-test-utils";
import { validWarehouseInput } from "../../warehouses/testing/warehouse-test-utils";

export { TEST_STORE_A_ID, TEST_STORE_B_ID };

export type MemoryWarehouseTransferModule = ReturnType<
  typeof createMemoryWarehouseTransferModule
>;

export function createMemoryWarehouseTransferModule(
  dependencies: {
    domainEventPublisher?: DomainEventPublisher;
  } = {},
) {
  const adjustmentModule = createMemoryInventoryAdjustmentModule(dependencies);
  const warehouseTransferRepository = new MemoryWarehouseTransferRepository(
    adjustmentModule.inventoryItemRepository,
  );

  return {
    ...adjustmentModule,
    warehouseTransferRepository,
    warehouseTransferService: new WarehouseTransferService({
      warehouseTransferRepository,
      inventoryItemRepository: adjustmentModule.inventoryItemRepository,
      warehouseRepository: adjustmentModule.warehouseRepository,
      ...dependencies,
    }),
  };
}

export async function seedSecondWarehouse(
  module: MemoryWarehouseTransferModule,
  overrides: Parameters<typeof validWarehouseInput>[0] = {},
) {
  const suffix = crypto.randomUUID().slice(0, 8).toUpperCase();

  return module.warehouseService.createWarehouse(
    validWarehouseInput({
      name: "Secondary Warehouse",
      code: `WH-${suffix}`,
      isDefault: false,
      ...overrides,
    }),
  );
}

export async function seedDraftWarehouseTransfer(
  module: MemoryWarehouseTransferModule,
  options: {
    initialQuantity?: number;
    transferQuantity?: number;
  } = {},
) {
  const { inventoryItem } = await seedInventoryItemForAdjustments(module, {
    initialQuantity: options.initialQuantity ?? 20,
  });
  const destinationWarehouse = await seedSecondWarehouse(module);

  const warehouseTransfer =
    await module.warehouseTransferService.createWarehouseTransfer({
      storeId: TEST_STORE_A_ID,
      sourceWarehouseId: inventoryItem.warehouseId,
      destinationWarehouseId: destinationWarehouse.id,
      items: [
        {
          inventoryItemId: inventoryItem.id,
          quantity: options.transferQuantity ?? 5,
        },
      ],
    });

  return { inventoryItem, destinationWarehouse, warehouseTransfer };
}

export async function seedApprovedWarehouseTransfer(
  module: MemoryWarehouseTransferModule,
  options: {
    initialQuantity?: number;
    transferQuantity?: number;
  } = {},
) {
  const seeded = await seedDraftWarehouseTransfer(module, options);

  const warehouseTransfer =
    await module.warehouseTransferService.approveWarehouseTransfer(
      seeded.warehouseTransfer.id,
      { storeId: TEST_STORE_A_ID },
    );

  return { ...seeded, warehouseTransfer };
}

export async function seedShippedWarehouseTransfer(
  module: MemoryWarehouseTransferModule,
  options: {
    initialQuantity?: number;
    transferQuantity?: number;
  } = {},
) {
  const seeded = await seedApprovedWarehouseTransfer(module, options);

  const result = await module.warehouseTransferService.shipWarehouseTransfer(
    seeded.warehouseTransfer.id,
    { storeId: TEST_STORE_A_ID },
  );

  return { ...seeded, warehouseTransfer: result.warehouseTransfer, shipResult: result };
}
