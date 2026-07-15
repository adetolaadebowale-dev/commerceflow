import type {
  ActivateWarehouseResponse,
  CreateWarehouseRequest,
  CreateWarehouseResponse,
  DeactivateWarehouseResponse,
  DeleteWarehouseResponse,
  GetWarehouseResponse,
  ListWarehousesParams,
  ListWarehousesResponse,
  UpdateWarehouseRequest,
  UpdateWarehouseResponse,
  WarehouseStoreScopedParams,
} from "./contracts";
import type { ApiClientConfig } from "../http/request";
import { apiRequest } from "../http/request";

function toQueryString(params: WarehouseStoreScopedParams): string {
  const searchParams = new URLSearchParams();
  searchParams.set("storeId", params.storeId);
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

function toListQueryString(params: ListWarehousesParams): string {
  const searchParams = new URLSearchParams();
  searchParams.set("storeId", params.storeId);
  searchParams.set("page", String(params.page));
  searchParams.set("limit", String(params.limit));

  if (params.status) {
    searchParams.set("status", params.status);
  }

  if (params.search) {
    searchParams.set("search", params.search);
  }

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export interface WarehouseClient {
  createWarehouse(
    input: CreateWarehouseRequest,
  ): Promise<CreateWarehouseResponse["data"]>;
  listWarehouses(
    params: ListWarehousesParams,
  ): Promise<ListWarehousesResponse["data"]>;
  getWarehouse(
    id: string,
    params: WarehouseStoreScopedParams,
  ): Promise<GetWarehouseResponse["data"]>;
  updateWarehouse(
    id: string,
    input: UpdateWarehouseRequest,
    params: WarehouseStoreScopedParams,
  ): Promise<UpdateWarehouseResponse["data"]>;
  deleteWarehouse(
    id: string,
    params: WarehouseStoreScopedParams,
  ): Promise<DeleteWarehouseResponse["data"]>;
  activateWarehouse(
    id: string,
    params: WarehouseStoreScopedParams,
  ): Promise<ActivateWarehouseResponse["data"]>;
  deactivateWarehouse(
    id: string,
    params: WarehouseStoreScopedParams,
  ): Promise<DeactivateWarehouseResponse["data"]>;
}

export function createWarehouseClient(config: ApiClientConfig): WarehouseClient {
  return {
    createWarehouse: (input) =>
      apiRequest<CreateWarehouseResponse["data"]>(config, {
        method: "POST",
        path: "/api/warehouses",
        body: input,
        accessToken: config.getAccessToken?.(),
      }),

    listWarehouses: (params) =>
      apiRequest<ListWarehousesResponse["data"]>(config, {
        method: "GET",
        path: `/api/warehouses${toListQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      }),

    getWarehouse: (id, params) =>
      apiRequest<GetWarehouseResponse["data"]>(config, {
        method: "GET",
        path: `/api/warehouses/${id}${toQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      }),

    updateWarehouse: (id, input, params) =>
      apiRequest<UpdateWarehouseResponse["data"]>(config, {
        method: "PATCH",
        path: `/api/warehouses/${id}${toQueryString(params)}`,
        body: input,
        accessToken: config.getAccessToken?.(),
      }),

    deleteWarehouse: (id, params) =>
      apiRequest<DeleteWarehouseResponse["data"]>(config, {
        method: "DELETE",
        path: `/api/warehouses/${id}${toQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      }),

    activateWarehouse: (id, params) =>
      apiRequest<ActivateWarehouseResponse["data"]>(config, {
        method: "POST",
        path: `/api/warehouses/${id}/activate${toQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      }),

    deactivateWarehouse: (id, params) =>
      apiRequest<DeactivateWarehouseResponse["data"]>(config, {
        method: "POST",
        path: `/api/warehouses/${id}/deactivate${toQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      }),
  };
}
