import type {
  CatalogueListResult,
  Warehouse,
} from "@commerceflow/types";
import type {
  CreateWarehouseInput,
  ListWarehousesQuery,
  UpdateWarehouseInput,
} from "@commerceflow/validation";

import type { ApiSuccessResponse } from "../common/api-response";

/** POST /warehouses */
export type CreateWarehouseRequest = CreateWarehouseInput;
export type CreateWarehouseResponse = ApiSuccessResponse<{ warehouse: Warehouse }>;

/** PATCH /warehouses/:id */
export type UpdateWarehouseRequest = UpdateWarehouseInput;
export type UpdateWarehouseResponse = ApiSuccessResponse<{ warehouse: Warehouse }>;

/** GET /warehouses/:id */
export type GetWarehouseResponse = ApiSuccessResponse<{ warehouse: Warehouse }>;

/** DELETE /warehouses/:id */
export type DeleteWarehouseResponse = ApiSuccessResponse<{ warehouse: Warehouse }>;

/** POST /warehouses/:id/activate */
export type ActivateWarehouseResponse = ApiSuccessResponse<{ warehouse: Warehouse }>;

/** POST /warehouses/:id/deactivate */
export type DeactivateWarehouseResponse = ApiSuccessResponse<{ warehouse: Warehouse }>;

/** GET /warehouses */
export type ListWarehousesParams = ListWarehousesQuery;
export type ListWarehousesResponse = ApiSuccessResponse<
  CatalogueListResult<Warehouse>
>;

export type WarehouseStoreScopedParams = Pick<ListWarehousesQuery, "storeId">;
