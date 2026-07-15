import type { InventoryAllocation } from "@commerceflow/types";
import type {
  AllocateInventoryInput,
  InventoryAllocationIdQuery,
  ReportShortageInput,
  UpdateInventoryAllocationInput,
} from "@commerceflow/validation";

import type { ApiSuccessResponse } from "../common/api-response";
import type { ApiClientConfig } from "../http/request";
import { apiRequest } from "../http/request";

function toQueryString(params: InventoryAllocationIdQuery): string {
  const searchParams = new URLSearchParams();
  searchParams.set("storeId", params.storeId);
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export type AllocateInventoryRequest = AllocateInventoryInput;
export type UpdateInventoryAllocationRequest = UpdateInventoryAllocationInput;
export type ReportShortageRequest = ReportShortageInput;
export type InventoryAllocationParams = InventoryAllocationIdQuery;

export type AllocateInventoryResponse = ApiSuccessResponse<{
  allocation: InventoryAllocation;
}>;
export type GetInventoryAllocationResponse = ApiSuccessResponse<{
  allocation: InventoryAllocation;
}>;
export type UpdateInventoryAllocationResponse = ApiSuccessResponse<{
  allocation: InventoryAllocation;
}>;
export type ReportShortageResponse = ApiSuccessResponse<{
  allocation: InventoryAllocation;
}>;

export interface AllocationClient {
  allocateInventory(
    pickListItemId: string,
    input: AllocateInventoryRequest,
    params: InventoryAllocationParams,
  ): Promise<AllocateInventoryResponse["data"]>;
  updatePickedQuantity(
    id: string,
    input: UpdateInventoryAllocationRequest,
    params: InventoryAllocationParams,
  ): Promise<UpdateInventoryAllocationResponse["data"]>;
  reportShortage(
    id: string,
    input: ReportShortageRequest,
    params: InventoryAllocationParams,
  ): Promise<ReportShortageResponse["data"]>;
  getAllocation(
    id: string,
    params: InventoryAllocationParams,
  ): Promise<GetInventoryAllocationResponse["data"]>;
}

export function createAllocationClient(config: ApiClientConfig): AllocationClient {
  return {
    allocateInventory: (pickListItemId, input, params) =>
      apiRequest<AllocateInventoryResponse["data"]>(config, {
        method: "POST",
        path: `/api/pick-list-items/${pickListItemId}/allocate${toQueryString(params)}`,
        body: input,
        accessToken: config.getAccessToken?.(),
      }),

    updatePickedQuantity: (id, input, params) =>
      apiRequest<UpdateInventoryAllocationResponse["data"]>(config, {
        method: "PATCH",
        path: `/api/inventory-allocations/${id}${toQueryString(params)}`,
        body: input,
        accessToken: config.getAccessToken?.(),
      }),

    reportShortage: (id, input, params) =>
      apiRequest<ReportShortageResponse["data"]>(config, {
        method: "POST",
        path: `/api/inventory-allocations/${id}/report-shortage${toQueryString(params)}`,
        body: input,
        accessToken: config.getAccessToken?.(),
      }),

    getAllocation: (id, params) =>
      apiRequest<GetInventoryAllocationResponse["data"]>(config, {
        method: "GET",
        path: `/api/inventory-allocations/${id}${toQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      }),
  };
}
