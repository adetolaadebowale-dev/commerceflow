import type {
  CatalogueListResult,
  InventoryItem,
  StockMovement,
} from "@commerceflow/types";
import type {
  CreateInventoryItemInput,
  CreateStockMovementInput,
  ListInventoryItemsQuery,
  ListStockMovementsQuery,
} from "@commerceflow/validation";

import { MemoryWarehouseRepository } from "@/warehouses/repositories/memory-warehouse.repository";
import { WarehouseService } from "@/warehouses/services/warehouse.service";
import {
  seedDefaultWarehouse,
  TEST_STORE_A_ID as WAREHOUSE_TEST_STORE_A_ID,
} from "@/warehouses/testing/warehouse-test-utils";

import { MemoryInventoryItemRepository } from "../repositories/memory-inventory-item.repository";
import { MemoryStockMovementRepository } from "../repositories/memory-stock-movement.repository";
import { InventoryService } from "../services/inventory.service";

export const TEST_STORE_A_ID = "11111111-1111-1111-1111-111111111111";
export const TEST_STORE_B_ID = "22222222-2222-2222-2222-222222222222";

const sharedWarehouseRepository = new MemoryWarehouseRepository();
let defaultWarehouseId: string | undefined;

export function getTestWarehouseId(): string {
  if (!defaultWarehouseId) {
    throw new Error("Test warehouse not seeded. Call seedTestWarehouse() first.");
  }

  return defaultWarehouseId;
}

export function createMemoryInventoryService(): {
  inventoryService: InventoryService;
  inventoryItemRepository: MemoryInventoryItemRepository;
  stockMovementRepository: MemoryStockMovementRepository;
  warehouseRepository: MemoryWarehouseRepository;
  warehouseService: WarehouseService;
} {
  const inventoryItemRepository = new MemoryInventoryItemRepository();
  const stockMovementRepository = new MemoryStockMovementRepository(
    inventoryItemRepository,
  );
  const warehouseService = new WarehouseService({
    warehouseRepository: sharedWarehouseRepository,
  });

  return {
    inventoryItemRepository,
    stockMovementRepository,
    warehouseRepository: sharedWarehouseRepository,
    warehouseService,
    inventoryService: new InventoryService({
      inventoryItemRepository,
      stockMovementRepository,
      warehouseRepository: sharedWarehouseRepository,
    }),
  };
}

export async function seedTestWarehouse(
  services: ReturnType<typeof createMemoryInventoryService>,
  storeId: string = TEST_STORE_A_ID,
): Promise<string> {
  const existing = await services.warehouseRepository.findDefaultByStoreId(
    storeId,
  );

  if (existing) {
    if (storeId === TEST_STORE_A_ID) {
      defaultWarehouseId = existing.id;
    }

    return existing.id;
  }

  const warehouse = await seedDefaultWarehouse(services.warehouseService, {
    storeId,
  });

  if (storeId === TEST_STORE_A_ID) {
    defaultWarehouseId = warehouse.id;
  }

  return warehouse.id;
}

export function validInventoryItemInput(
  productVariantId: string,
  overrides: Partial<CreateInventoryItemInput> = {},
): CreateInventoryItemInput {
  return {
    storeId: TEST_STORE_A_ID,
    warehouseId: getTestWarehouseId(),
    productVariantId,
    initialQuantity: 10,
    ...overrides,
  };
}

export function validStockMovementInput(
  inventoryItemId: string,
  overrides: Partial<CreateStockMovementInput> = {},
): CreateStockMovementInput {
  return {
    storeId: TEST_STORE_A_ID,
    inventoryItemId,
    quantityChange: 5,
    reason: "manual_adjustment",
    ...overrides,
  };
}

export const TEST_VARIANT_A_ID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
export const TEST_VARIANT_B_ID = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";

export type {
  CatalogueListResult,
  CreateInventoryItemInput,
  CreateStockMovementInput,
  InventoryItem,
  ListInventoryItemsQuery,
  ListStockMovementsQuery,
  StockMovement,
};

export { WAREHOUSE_TEST_STORE_A_ID };
