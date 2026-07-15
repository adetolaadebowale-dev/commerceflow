import type {
  InventoryAdjustment,
  InventoryAdjustmentResult,
} from "@commerceflow/types";
import type {
  CreateInventoryAdjustmentInput,
  InventoryAdjustmentIdQuery,
  ListInventoryAdjustmentsQuery,
} from "@commerceflow/validation";

import type { ApiSuccessResponse } from "../common/api-response";
import type { ApiClientConfig } from "../http/request";
import { apiRequest } from "../http/request";

function toQueryString(
  params: ListInventoryAdjustmentsQuery | InventoryAdjustmentIdQuery,
): string {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      searchParams.set(key, String(value));
    }
  }

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export type CreateAdjustmentRequest = CreateInventoryAdjustmentInput;
export type CreateAdjustmentResponse = ApiSuccessResponse<{
  result: InventoryAdjustmentResult;
}>;
export type GetAdjustmentParams = InventoryAdjustmentIdQuery;
export type GetAdjustmentResponse = ApiSuccessResponse<{
  adjustment: InventoryAdjustment;
}>;
export type ListAdjustmentsParams = ListInventoryAdjustmentsQuery;
export type ListAdjustmentsResponse = ApiSuccessResponse<{
  adjustments: import("@commerceflow/types").CatalogueListResult<InventoryAdjustment>;
}>;

export interface InventoryAdjustmentClient {
  createAdjustment(
    input: CreateAdjustmentRequest,
  ): Promise<CreateAdjustmentResponse["data"]>;
  getAdjustment(
    id: string,
    params: GetAdjustmentParams,
  ): Promise<GetAdjustmentResponse["data"]>;
  listAdjustments(
    params: ListAdjustmentsParams,
  ): Promise<ListAdjustmentsResponse["data"]>;
}

export function createInventoryAdjustmentClient(
  config: ApiClientConfig,
): InventoryAdjustmentClient {
  return {
    createAdjustment: (input) =>
      apiRequest<CreateAdjustmentResponse["data"]>(config, {
        method: "POST",
        path: "/api/inventory-adjustments",
        body: input,
        accessToken: config.getAccessToken?.(),
      }),

    getAdjustment: (id, params) =>
      apiRequest<GetAdjustmentResponse["data"]>(config, {
        method: "GET",
        path: `/api/inventory-adjustments/${id}${toQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      }),

    listAdjustments: (params) =>
      apiRequest<ListAdjustmentsResponse["data"]>(config, {
        method: "GET",
        path: `/api/inventory-adjustments${toQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      }),
  };
}
