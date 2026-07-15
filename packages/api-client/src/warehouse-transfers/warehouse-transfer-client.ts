import type {
  ApproveWarehouseTransferRequest,
  ApproveWarehouseTransferResponse,
  CancelWarehouseTransferRequest,
  CancelWarehouseTransferResponse,
  CreateWarehouseTransferRequest,
  CreateWarehouseTransferResponse,
  GetWarehouseTransferResponse,
  ListWarehouseTransfersParams,
  ListWarehouseTransfersResponse,
  ReceiveWarehouseTransferRequest,
  ReceiveWarehouseTransferResponse,
  ShipWarehouseTransferRequest,
  ShipWarehouseTransferResponse,
  WarehouseTransferStoreScopedParams,
} from "./contracts";
import type { ApiClientConfig } from "../http/request";
import { apiRequest } from "../http/request";

function toQueryString(params: WarehouseTransferStoreScopedParams): string {
  const searchParams = new URLSearchParams();
  searchParams.set("storeId", params.storeId);
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

function toListQueryString(params: ListWarehouseTransfersParams): string {
  const searchParams = new URLSearchParams();
  searchParams.set("storeId", params.storeId);
  searchParams.set("page", String(params.page));
  searchParams.set("limit", String(params.limit));
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export interface WarehouseTransferClient {
  createWarehouseTransfer(
    input: CreateWarehouseTransferRequest,
  ): Promise<CreateWarehouseTransferResponse["data"]>;
  listWarehouseTransfers(
    params: ListWarehouseTransfersParams,
  ): Promise<ListWarehouseTransfersResponse["data"]>;
  getWarehouseTransfer(
    id: string,
    params: WarehouseTransferStoreScopedParams,
  ): Promise<GetWarehouseTransferResponse["data"]>;
  approveWarehouseTransfer(
    id: string,
    input: ApproveWarehouseTransferRequest,
  ): Promise<ApproveWarehouseTransferResponse["data"]>;
  shipWarehouseTransfer(
    id: string,
    input: ShipWarehouseTransferRequest,
  ): Promise<ShipWarehouseTransferResponse["data"]>;
  receiveWarehouseTransfer(
    id: string,
    input: ReceiveWarehouseTransferRequest,
  ): Promise<ReceiveWarehouseTransferResponse["data"]>;
  cancelWarehouseTransfer(
    id: string,
    input: CancelWarehouseTransferRequest,
  ): Promise<CancelWarehouseTransferResponse["data"]>;
}

export function createWarehouseTransferClient(
  config: ApiClientConfig,
): WarehouseTransferClient {
  return {
    createWarehouseTransfer: (input) =>
      apiRequest<CreateWarehouseTransferResponse["data"]>(config, {
        method: "POST",
        path: "/api/warehouse-transfers",
        body: input,
        accessToken: config.getAccessToken?.(),
      }),

    listWarehouseTransfers: (params) =>
      apiRequest<ListWarehouseTransfersResponse["data"]>(config, {
        method: "GET",
        path: `/api/warehouse-transfers${toListQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      }),

    getWarehouseTransfer: (id, params) =>
      apiRequest<GetWarehouseTransferResponse["data"]>(config, {
        method: "GET",
        path: `/api/warehouse-transfers/${id}${toQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      }),

    approveWarehouseTransfer: (id, input) =>
      apiRequest<ApproveWarehouseTransferResponse["data"]>(config, {
        method: "POST",
        path: `/api/warehouse-transfers/${id}/approve`,
        body: input,
        accessToken: config.getAccessToken?.(),
      }),

    shipWarehouseTransfer: (id, input) =>
      apiRequest<ShipWarehouseTransferResponse["data"]>(config, {
        method: "POST",
        path: `/api/warehouse-transfers/${id}/ship`,
        body: input,
        accessToken: config.getAccessToken?.(),
      }),

    receiveWarehouseTransfer: (id, input) =>
      apiRequest<ReceiveWarehouseTransferResponse["data"]>(config, {
        method: "POST",
        path: `/api/warehouse-transfers/${id}/receive`,
        body: input,
        accessToken: config.getAccessToken?.(),
      }),

    cancelWarehouseTransfer: (id, input) =>
      apiRequest<CancelWarehouseTransferResponse["data"]>(config, {
        method: "POST",
        path: `/api/warehouse-transfers/${id}/cancel`,
        body: input,
        accessToken: config.getAccessToken?.(),
      }),
  };
}
