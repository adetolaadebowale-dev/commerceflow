import type {
  CreateWarehouseRequest,
  ListWarehousesParams,
  UpdateWarehouseRequest,
} from "@commerceflow/api-client";
import type { CatalogueListResult, Warehouse } from "@commerceflow/types";

import {
  toAdminApiError,
  warehouseClient,
} from "@/services/warehouse-client";

export interface StoreScopedParams {
  readonly storeId: string;
}

export async function listWarehouses(
  params: ListWarehousesParams,
): Promise<CatalogueListResult<Warehouse>> {
  try {
    return await warehouseClient.listWarehouses(params);
  } catch (error) {
    throw toAdminApiError(error);
  }
}

export async function createWarehouse(
  input: CreateWarehouseRequest,
): Promise<Warehouse> {
  try {
    const result = await warehouseClient.createWarehouse(input);
    return result.warehouse;
  } catch (error) {
    throw toAdminApiError(error);
  }
}

export async function updateWarehouse(
  id: string,
  input: UpdateWarehouseRequest,
  params: StoreScopedParams,
): Promise<Warehouse> {
  try {
    const result = await warehouseClient.updateWarehouse(id, input, params);
    return result.warehouse;
  } catch (error) {
    throw toAdminApiError(error);
  }
}

export async function deleteWarehouse(
  id: string,
  params: StoreScopedParams,
): Promise<Warehouse> {
  try {
    const result = await warehouseClient.deleteWarehouse(id, params);
    return result.warehouse;
  } catch (error) {
    throw toAdminApiError(error);
  }
}
