import type {
  ApprovePurchaseOrderRequest,
  ApprovePurchaseOrderResponse,
  CancelPurchaseOrderRequest,
  CancelPurchaseOrderResponse,
  CreatePurchaseOrderRequest,
  CreatePurchaseOrderResponse,
  GetPurchaseOrderResponse,
  ListPurchaseOrdersParams,
  ListPurchaseOrdersResponse,
  OrderPurchaseOrderRequest,
  OrderPurchaseOrderResponse,
  PurchaseOrderStoreScopedParams,
  ReceivePurchaseOrderRequest,
  ReceivePurchaseOrderResponse,
} from "./contracts";
import type { ApiClientConfig } from "../http/request";
import { apiRequest } from "../http/request";

function toQueryString(params: PurchaseOrderStoreScopedParams): string {
  const searchParams = new URLSearchParams();
  searchParams.set("storeId", params.storeId);
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

function toListQueryString(params: ListPurchaseOrdersParams): string {
  const searchParams = new URLSearchParams();
  searchParams.set("storeId", params.storeId);
  searchParams.set("page", String(params.page));
  searchParams.set("limit", String(params.limit));
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export interface PurchaseOrderClient {
  createPurchaseOrder(
    input: CreatePurchaseOrderRequest,
  ): Promise<CreatePurchaseOrderResponse["data"]>;
  listPurchaseOrders(
    params: ListPurchaseOrdersParams,
  ): Promise<ListPurchaseOrdersResponse["data"]>;
  getPurchaseOrder(
    id: string,
    params: PurchaseOrderStoreScopedParams,
  ): Promise<GetPurchaseOrderResponse["data"]>;
  approvePurchaseOrder(
    id: string,
    input: ApprovePurchaseOrderRequest,
  ): Promise<ApprovePurchaseOrderResponse["data"]>;
  orderPurchaseOrder(
    id: string,
    input: OrderPurchaseOrderRequest,
  ): Promise<OrderPurchaseOrderResponse["data"]>;
  receivePurchaseOrder(
    id: string,
    input: ReceivePurchaseOrderRequest,
  ): Promise<ReceivePurchaseOrderResponse["data"]>;
  cancelPurchaseOrder(
    id: string,
    input: CancelPurchaseOrderRequest,
  ): Promise<CancelPurchaseOrderResponse["data"]>;
}

export function createPurchaseOrderClient(
  config: ApiClientConfig,
): PurchaseOrderClient {
  return {
    createPurchaseOrder: (input) =>
      apiRequest<CreatePurchaseOrderResponse["data"]>(config, {
        method: "POST",
        path: "/api/purchase-orders",
        body: input,
        accessToken: config.getAccessToken?.(),
      }),

    listPurchaseOrders: (params) =>
      apiRequest<ListPurchaseOrdersResponse["data"]>(config, {
        method: "GET",
        path: `/api/purchase-orders${toListQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      }),

    getPurchaseOrder: (id, params) =>
      apiRequest<GetPurchaseOrderResponse["data"]>(config, {
        method: "GET",
        path: `/api/purchase-orders/${id}${toQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      }),

    approvePurchaseOrder: (id, input) =>
      apiRequest<ApprovePurchaseOrderResponse["data"]>(config, {
        method: "POST",
        path: `/api/purchase-orders/${id}/approve`,
        body: input,
        accessToken: config.getAccessToken?.(),
      }),

    orderPurchaseOrder: (id, input) =>
      apiRequest<OrderPurchaseOrderResponse["data"]>(config, {
        method: "POST",
        path: `/api/purchase-orders/${id}/order`,
        body: input,
        accessToken: config.getAccessToken?.(),
      }),

    receivePurchaseOrder: (id, input) =>
      apiRequest<ReceivePurchaseOrderResponse["data"]>(config, {
        method: "POST",
        path: `/api/purchase-orders/${id}/receive`,
        body: input,
        accessToken: config.getAccessToken?.(),
      }),

    cancelPurchaseOrder: (id, input) =>
      apiRequest<CancelPurchaseOrderResponse["data"]>(config, {
        method: "POST",
        path: `/api/purchase-orders/${id}/cancel`,
        body: input,
        accessToken: config.getAccessToken?.(),
      }),
  };
}
