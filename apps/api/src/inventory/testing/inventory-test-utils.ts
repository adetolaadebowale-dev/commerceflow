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

import { MemoryInventoryItemRepository } from "../repositories/memory-inventory-item.repository";
import { MemoryStockMovementRepository } from "../repositories/memory-stock-movement.repository";
import { InventoryService } from "../services/inventory.service";

export const TEST_STORE_A_ID = "11111111-1111-1111-1111-111111111111";
export const TEST_STORE_B_ID = "22222222-2222-2222-2222-222222222222";

export function createMemoryInventoryService(): {
  inventoryService: InventoryService;
  inventoryItemRepository: MemoryInventoryItemRepository;
  stockMovementRepository: MemoryStockMovementRepository;
} {
  const inventoryItemRepository = new MemoryInventoryItemRepository();
  const stockMovementRepository = new MemoryStockMovementRepository(
    inventoryItemRepository,
  );

  return {
    inventoryItemRepository,
    stockMovementRepository,
    inventoryService: new InventoryService({
      inventoryItemRepository,
      stockMovementRepository,
    }),
  };
}

export function validInventoryItemInput(
  productVariantId: string,
  overrides: Partial<CreateInventoryItemInput> = {},
): CreateInventoryItemInput {
  return {
    storeId: TEST_STORE_A_ID,
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
