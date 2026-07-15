import type {
  CreateShippingMethodRequest,
  CreateShippingMethodResponse,
  CreateShippingZoneRequest,
  CreateShippingZoneResponse,
  DeleteShippingMethodResponse,
  DeleteShippingZoneResponse,
  GetShippingMethodResponse,
  GetShippingZoneResponse,
  ListShippingMethodsParams,
  ListShippingMethodsResponse,
  ListShippingZonesParams,
  ListShippingZonesResponse,
  ShippingMethodStoreScopedParams,
  ShippingZoneStoreScopedParams,
  UpdateShippingMethodRequest,
  UpdateShippingMethodResponse,
  UpdateShippingZoneRequest,
  UpdateShippingZoneResponse,
} from "./contracts";
import type { ApiClientConfig } from "../http/request";
import { apiRequest } from "../http/request";

function toQueryString(
  params: ShippingZoneStoreScopedParams | ShippingMethodStoreScopedParams,
): string {
  const searchParams = new URLSearchParams();
  searchParams.set("storeId", params.storeId);
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

function toListZonesQueryString(params: ListShippingZonesParams): string {
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

function toListMethodsQueryString(params: ListShippingMethodsParams): string {
  const searchParams = new URLSearchParams();
  searchParams.set("storeId", params.storeId);
  searchParams.set("page", String(params.page));
  searchParams.set("limit", String(params.limit));

  if (params.status) {
    searchParams.set("status", params.status);
  }

  if (params.shippingZoneId) {
    searchParams.set("shippingZoneId", params.shippingZoneId);
  }

  if (params.search) {
    searchParams.set("search", params.search);
  }

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export interface ShippingConfigurationClient {
  createShippingZone(
    input: CreateShippingZoneRequest,
  ): Promise<CreateShippingZoneResponse["data"]>;
  listShippingZones(
    params: ListShippingZonesParams,
  ): Promise<ListShippingZonesResponse["data"]>;
  getShippingZone(
    id: string,
    params: ShippingZoneStoreScopedParams,
  ): Promise<GetShippingZoneResponse["data"]>;
  updateShippingZone(
    id: string,
    input: UpdateShippingZoneRequest,
    params: ShippingZoneStoreScopedParams,
  ): Promise<UpdateShippingZoneResponse["data"]>;
  deleteShippingZone(
    id: string,
    params: ShippingZoneStoreScopedParams,
  ): Promise<DeleteShippingZoneResponse["data"]>;
  createShippingMethod(
    input: CreateShippingMethodRequest,
  ): Promise<CreateShippingMethodResponse["data"]>;
  listShippingMethods(
    params: ListShippingMethodsParams,
  ): Promise<ListShippingMethodsResponse["data"]>;
  getShippingMethod(
    id: string,
    params: ShippingMethodStoreScopedParams,
  ): Promise<GetShippingMethodResponse["data"]>;
  updateShippingMethod(
    id: string,
    input: UpdateShippingMethodRequest,
    params: ShippingMethodStoreScopedParams,
  ): Promise<UpdateShippingMethodResponse["data"]>;
  deleteShippingMethod(
    id: string,
    params: ShippingMethodStoreScopedParams,
  ): Promise<DeleteShippingMethodResponse["data"]>;
}

export function createShippingConfigurationClient(
  config: ApiClientConfig,
): ShippingConfigurationClient {
  return {
    createShippingZone: (input) =>
      apiRequest<CreateShippingZoneResponse["data"]>(config, {
        method: "POST",
        path: "/api/shipping-zones",
        body: input,
        accessToken: config.getAccessToken?.(),
      }),

    listShippingZones: (params) =>
      apiRequest<ListShippingZonesResponse["data"]>(config, {
        method: "GET",
        path: `/api/shipping-zones${toListZonesQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      }),

    getShippingZone: (id, params) =>
      apiRequest<GetShippingZoneResponse["data"]>(config, {
        method: "GET",
        path: `/api/shipping-zones/${id}${toQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      }),

    updateShippingZone: (id, input, params) =>
      apiRequest<UpdateShippingZoneResponse["data"]>(config, {
        method: "PATCH",
        path: `/api/shipping-zones/${id}${toQueryString(params)}`,
        body: input,
        accessToken: config.getAccessToken?.(),
      }),

    deleteShippingZone: (id, params) =>
      apiRequest<DeleteShippingZoneResponse["data"]>(config, {
        method: "DELETE",
        path: `/api/shipping-zones/${id}${toQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      }),

    createShippingMethod: (input) =>
      apiRequest<CreateShippingMethodResponse["data"]>(config, {
        method: "POST",
        path: "/api/shipping-methods",
        body: input,
        accessToken: config.getAccessToken?.(),
      }),

    listShippingMethods: (params) =>
      apiRequest<ListShippingMethodsResponse["data"]>(config, {
        method: "GET",
        path: `/api/shipping-methods${toListMethodsQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      }),

    getShippingMethod: (id, params) =>
      apiRequest<GetShippingMethodResponse["data"]>(config, {
        method: "GET",
        path: `/api/shipping-methods/${id}${toQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      }),

    updateShippingMethod: (id, input, params) =>
      apiRequest<UpdateShippingMethodResponse["data"]>(config, {
        method: "PATCH",
        path: `/api/shipping-methods/${id}${toQueryString(params)}`,
        body: input,
        accessToken: config.getAccessToken?.(),
      }),

    deleteShippingMethod: (id, params) =>
      apiRequest<DeleteShippingMethodResponse["data"]>(config, {
        method: "DELETE",
        path: `/api/shipping-methods/${id}${toQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      }),
  };
}
