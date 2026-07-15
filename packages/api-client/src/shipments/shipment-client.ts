import type {
  CreateShipmentRequest,
  CreateShipmentResponse,
  CreateShipmentTrackingEventRequest,
  CreateShipmentTrackingEventResponse,
  GetShipmentResponse,
  ListOrderShipmentsParams,
  ListOrderShipmentsResponse,
  ListShipmentTrackingEventsResponse,
  ShipmentActionResponse,
  ShipmentStoreScopedParams,
  ShipmentTrackingParams,
} from "./contracts";
import type { ApiClientConfig } from "../http/request";
import { apiRequest } from "../http/request";

function toQueryString(params: ShipmentStoreScopedParams): string {
  const searchParams = new URLSearchParams();
  searchParams.set("storeId", params.storeId);
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

function toTrackingQueryString(params: ShipmentTrackingParams): string {
  const searchParams = new URLSearchParams();
  searchParams.set("storeId", params.storeId);
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export interface ShipmentClient {
  createShipment(
    orderId: string,
    input: CreateShipmentRequest,
    params: ShipmentStoreScopedParams,
  ): Promise<CreateShipmentResponse["data"]>;
  listOrderShipments(
    orderId: string,
    params: ListOrderShipmentsParams,
  ): Promise<ListOrderShipmentsResponse["data"]>;
  getShipment(
    id: string,
    params: ShipmentStoreScopedParams,
  ): Promise<GetShipmentResponse["data"]>;
  shipShipment(
    id: string,
    params: ShipmentStoreScopedParams,
  ): Promise<ShipmentActionResponse["data"]>;
  deliverShipment(
    id: string,
    params: ShipmentStoreScopedParams,
  ): Promise<ShipmentActionResponse["data"]>;
  cancelShipment(
    id: string,
    params: ShipmentStoreScopedParams,
  ): Promise<ShipmentActionResponse["data"]>;
  listTrackingEvents(
    id: string,
    params: ShipmentTrackingParams,
  ): Promise<ListShipmentTrackingEventsResponse["data"]>;
  createTrackingEvent(
    id: string,
    input: CreateShipmentTrackingEventRequest,
    params: ShipmentTrackingParams,
  ): Promise<CreateShipmentTrackingEventResponse["data"]>;
}

export function createShipmentClient(config: ApiClientConfig): ShipmentClient {
  return {
    createShipment: (orderId, input, params) =>
      apiRequest<CreateShipmentResponse["data"]>(config, {
        method: "POST",
        path: `/api/orders/${orderId}/shipments${toQueryString(params)}`,
        body: input,
        accessToken: config.getAccessToken?.(),
      }),

    listOrderShipments: (orderId, params) =>
      apiRequest<ListOrderShipmentsResponse["data"]>(config, {
        method: "GET",
        path: `/api/orders/${orderId}/shipments${toQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      }),

    getShipment: (id, params) =>
      apiRequest<GetShipmentResponse["data"]>(config, {
        method: "GET",
        path: `/api/shipments/${id}${toQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      }),

    shipShipment: (id, params) =>
      apiRequest<ShipmentActionResponse["data"]>(config, {
        method: "POST",
        path: `/api/shipments/${id}/ship${toQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      }),

    deliverShipment: (id, params) =>
      apiRequest<ShipmentActionResponse["data"]>(config, {
        method: "POST",
        path: `/api/shipments/${id}/deliver${toQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      }),

    cancelShipment: (id, params) =>
      apiRequest<ShipmentActionResponse["data"]>(config, {
        method: "POST",
        path: `/api/shipments/${id}/cancel${toQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      }),

    listTrackingEvents: (id, params) =>
      apiRequest<ListShipmentTrackingEventsResponse["data"]>(config, {
        method: "GET",
        path: `/api/shipments/${id}/tracking-events${toTrackingQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      }),

    createTrackingEvent: (id, input, params) =>
      apiRequest<CreateShipmentTrackingEventResponse["data"]>(config, {
        method: "POST",
        path: `/api/shipments/${id}/tracking-events${toTrackingQueryString(params)}`,
        body: input,
        accessToken: config.getAccessToken?.(),
      }),
  };
}
