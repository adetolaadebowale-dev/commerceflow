import type {
  CreateInventoryAdjustmentInput,
  ListInventoryAdjustmentsQuery,
} from "@commerceflow/validation";
import type {
  CatalogueListResult,
  InventoryAdjustment,
  InventoryAdjustmentResult,
  InventoryItem,
  InventorySummary,
  StockMovement,
} from "@commerceflow/types";

import {
  fulfillmentClient,
  inventoryAdjustmentClient,
  inventoryClient,
  reportsClient,
  toAdminApiError,
} from "@/services/inventory-client";

export interface StoreScopedParams {
  readonly storeId: string;
}

export async function listInventoryItems(params: {
  readonly storeId: string;
  readonly productVariantId?: string;
  readonly page?: number;
  readonly limit?: number;
}): Promise<CatalogueListResult<InventoryItem>> {
  try {
    return await inventoryClient.listInventoryItems(params);
  } catch (error) {
    throw toAdminApiError(error);
  }
}

export async function getInventorySummary(params: {
  readonly storeId: string;
  readonly productVariantIds?: readonly string[];
}): Promise<InventorySummary> {
  try {
    // reportsClient types claim full ApiSuccessResponse but apiRequest returns data.
    const result = (await reportsClient.getInventorySummary({
      storeId: params.storeId,
      productVariantIds: params.productVariantIds
        ? [...params.productVariantIds]
        : undefined,
    })) as unknown as InventorySummary | { data: InventorySummary };

    if (result && typeof result === "object" && "data" in result) {
      return result.data;
    }
    return result as InventorySummary;
  } catch (error) {
    throw toAdminApiError(error);
  }
}

export async function createInventoryAdjustment(
  input: CreateInventoryAdjustmentInput,
): Promise<InventoryAdjustmentResult> {
  try {
    const result = await inventoryAdjustmentClient.createAdjustment(input);
    return result.result;
  } catch (error) {
    throw toAdminApiError(error);
  }
}

export async function listInventoryAdjustments(
  params: ListInventoryAdjustmentsQuery,
): Promise<CatalogueListResult<InventoryAdjustment>> {
  try {
    const result = await inventoryAdjustmentClient.listAdjustments(params);
    return result.adjustments;
  } catch (error) {
    throw toAdminApiError(error);
  }
}

export async function listInventoryItemStockMovements(
  inventoryItemId: string,
  params: {
    readonly storeId: string;
    readonly page?: number;
    readonly limit?: number;
  },
): Promise<CatalogueListResult<StockMovement>> {
  try {
    return await fulfillmentClient.listStockMovements(inventoryItemId, {
      storeId: params.storeId,
      page: params.page ?? 1,
      limit: params.limit ?? 10,
    });
  } catch (error) {
    throw toAdminApiError(error);
  }
}
