import type { CatalogueListResult, InventoryItem } from "@commerceflow/types";
import type {
  CreateInventoryItemInput,
  CreateStockMovementInput,
  ListInventoryItemsQuery,
} from "@commerceflow/validation";

import type { InventoryAdjustmentResult } from "./inventory-adjustment-result";

export interface InventoryItemRepository {
  findById(storeId: string, id: string): Promise<InventoryItem | null>;
  findByProductVariantId(
    storeId: string,
    productVariantId: string,
  ): Promise<InventoryItem | null>;
  list(
    query: ListInventoryItemsQuery,
  ): Promise<CatalogueListResult<InventoryItem>>;
  createWithInitialMovement(
    input: CreateInventoryItemInput,
  ): Promise<InventoryAdjustmentResult>;
  adjustStock(
    input: CreateStockMovementInput,
  ): Promise<InventoryAdjustmentResult>;
  productVariantExists(
    storeId: string,
    productVariantId: string,
  ): Promise<boolean>;
  restockForReturn(
    storeId: string,
    inventoryItemId: string,
    quantity: number,
    context: {
      returnId: string;
      returnItemId: string;
      reference: string;
    },
  ): Promise<InventoryAdjustmentResult>;
}
