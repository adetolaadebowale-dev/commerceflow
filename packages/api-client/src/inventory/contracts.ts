import type {
  CatalogueListResult,
  InventoryItem,
  StockMovement,
} from "@commerceflow/types";
import type {
  CreateInventoryItemInput,
  CreateStockMovementInput,
} from "@commerceflow/validation";

import type { ApiSuccessResponse } from "../common/api-response";

export interface InventoryAdjustmentResult {
  readonly inventoryItem: InventoryItem;
  readonly stockMovement: StockMovement;
}

/** POST /inventory-items */
export type CreateInventoryItemRequest = CreateInventoryItemInput;
export type CreateInventoryItemResponse =
  ApiSuccessResponse<InventoryAdjustmentResult>;

/** GET /inventory-items/:id */
export type GetInventoryItemResponse = ApiSuccessResponse<{
  inventoryItem: InventoryItem;
}>;

/** GET /inventory-items */
export type ListInventoryItemsResponse = ApiSuccessResponse<
  CatalogueListResult<InventoryItem>
>;

/** POST /stock-movements */
export type CreateStockMovementRequest = CreateStockMovementInput;
export type CreateStockMovementResponse =
  ApiSuccessResponse<InventoryAdjustmentResult>;

/** GET /stock-movements */
export type ListStockMovementsResponse = ApiSuccessResponse<
  CatalogueListResult<StockMovement>
>;

export interface StoreScopedParams {
  readonly storeId: string;
}

export interface ListInventoryItemsParams extends StoreScopedParams {
  readonly page?: number;
  readonly limit?: number;
  readonly productVariantId?: string;
}

export interface ListStockMovementsParams extends StoreScopedParams {
  readonly page?: number;
  readonly limit?: number;
  readonly inventoryItemId?: string;
}
