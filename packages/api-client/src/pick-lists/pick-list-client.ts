import type {
  CompletePickListRequest,
  CreatePickListRequest,
  CreatePickListResponse,
  GetPickListResponse,
  ListPickListsResponse,
  PickListActionResponse,
  PickListIdParams,
  PickListParams,
} from "./contracts";
import type { ApiClientConfig } from "../http/request";
import { apiRequest } from "../http/request";

function toQueryString(params: PickListParams): string {
  const searchParams = new URLSearchParams();
  searchParams.set("storeId", params.storeId);
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

function toIdQueryString(params: PickListIdParams): string {
  const searchParams = new URLSearchParams();
  searchParams.set("storeId", params.storeId);
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export interface PickListClient {
  createPickList(
    shipmentId: string,
    input: CreatePickListRequest,
    params: PickListParams,
  ): Promise<CreatePickListResponse["data"]>;
  listShipmentPickLists(
    shipmentId: string,
    params: PickListParams,
  ): Promise<ListPickListsResponse["data"]>;
  getPickList(
    id: string,
    params: PickListIdParams,
  ): Promise<GetPickListResponse["data"]>;
  startPicking(
    id: string,
    params: PickListIdParams,
  ): Promise<PickListActionResponse["data"]>;
  completePicking(
    id: string,
    input: CompletePickListRequest | undefined,
    params: PickListIdParams,
  ): Promise<PickListActionResponse["data"]>;
  markPacked(
    id: string,
    params: PickListIdParams,
  ): Promise<PickListActionResponse["data"]>;
}

export function createPickListClient(config: ApiClientConfig): PickListClient {
  return {
    createPickList: (shipmentId, input, params) =>
      apiRequest<CreatePickListResponse["data"]>(config, {
        method: "POST",
        path: `/api/shipments/${shipmentId}/pick-lists${toQueryString(params)}`,
        body: input,
        accessToken: config.getAccessToken?.(),
      }),

    listShipmentPickLists: (shipmentId, params) =>
      apiRequest<ListPickListsResponse["data"]>(config, {
        method: "GET",
        path: `/api/shipments/${shipmentId}/pick-lists${toQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      }),

    getPickList: (id, params) =>
      apiRequest<GetPickListResponse["data"]>(config, {
        method: "GET",
        path: `/api/pick-lists/${id}${toIdQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      }),

    startPicking: (id, params) =>
      apiRequest<PickListActionResponse["data"]>(config, {
        method: "POST",
        path: `/api/pick-lists/${id}/start${toIdQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      }),

    completePicking: (id, input, params) =>
      apiRequest<PickListActionResponse["data"]>(config, {
        method: "POST",
        path: `/api/pick-lists/${id}/complete${toIdQueryString(params)}`,
        body: input ?? {},
        accessToken: config.getAccessToken?.(),
      }),

    markPacked: (id, params) =>
      apiRequest<PickListActionResponse["data"]>(config, {
        method: "POST",
        path: `/api/pick-lists/${id}/pack${toIdQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      }),
  };
}
