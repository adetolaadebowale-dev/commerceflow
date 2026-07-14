import type {
  CreateInventoryItemRequest,
  CreateInventoryItemResponse,
  CreateStockMovementRequest,
  CreateStockMovementResponse,
  GetInventoryItemResponse,
  ListInventoryItemsParams,
  ListInventoryItemsResponse,
  ListStockMovementsParams,
  ListStockMovementsResponse,
  StoreScopedParams,
} from "./contracts";
import type { ApiClientConfig } from "../http/request";
import { apiRequest } from "../http/request";

function toQueryString(
  params:
    | ListInventoryItemsParams
    | ListStockMovementsParams
    | StoreScopedParams,
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

export interface InventoryClient {
  createInventoryItem(
    input: CreateInventoryItemRequest,
  ): Promise<CreateInventoryItemResponse["data"]>;
  getInventoryItem(
    id: string,
    params: StoreScopedParams,
  ): Promise<GetInventoryItemResponse["data"]>;
  listInventoryItems(
    params: ListInventoryItemsParams,
  ): Promise<ListInventoryItemsResponse["data"]>;
  createStockMovement(
    input: CreateStockMovementRequest,
  ): Promise<CreateStockMovementResponse["data"]>;
  listStockMovements(
    params: ListStockMovementsParams,
  ): Promise<ListStockMovementsResponse["data"]>;
}

export function createInventoryClient(config: ApiClientConfig): InventoryClient {
  return {
    createInventoryItem: (input) =>
      apiRequest<CreateInventoryItemResponse["data"]>(config, {
        method: "POST",
        path: "/api/inventory-items",
        body: input,
        accessToken: config.getAccessToken?.(),
      }),

    getInventoryItem: (id, params) =>
      apiRequest<GetInventoryItemResponse["data"]>(config, {
        method: "GET",
        path: `/api/inventory-items/${id}${toQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      }),

    listInventoryItems: (params) =>
      apiRequest<ListInventoryItemsResponse["data"]>(config, {
        method: "GET",
        path: `/api/inventory-items${toQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      }),

    createStockMovement: (input) =>
      apiRequest<CreateStockMovementResponse["data"]>(config, {
        method: "POST",
        path: "/api/stock-movements",
        body: input,
        accessToken: config.getAccessToken?.(),
      }),

    listStockMovements: (params) =>
      apiRequest<ListStockMovementsResponse["data"]>(config, {
        method: "GET",
        path: `/api/stock-movements${toQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      }),
  };
}
