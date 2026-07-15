import type {
  CreateShipmentRequest,
  CreateShipmentResponse,
  CreateShipmentTrackingEventRequest,
  CreateShipmentTrackingEventResponse,
  CreateShipmentPackageRequest,
  CreateShipmentPackageResponse,
  GetShipmentResponse,
  GetShipmentPackageResponse,
  ListOrderShipmentsParams,
  ListOrderShipmentsResponse,
  ListShipmentTrackingEventsResponse,
  ListShipmentPackagesResponse,
  ShipmentActionResponse,
  ShipmentPackageActionResponse,
  ShipmentPackageIdParams,
  ShipmentPackageParams,
  ShipmentStoreScopedParams,
  ShipmentTrackingParams,
  UpdateShipmentPackageRequest,
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

function toPackageQueryString(params: ShipmentPackageParams): string {
  const searchParams = new URLSearchParams();
  searchParams.set("storeId", params.storeId);
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

function toPackageIdQueryString(params: ShipmentPackageIdParams): string {
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
  createPackage(
    shipmentId: string,
    input: CreateShipmentPackageRequest,
    params: ShipmentPackageParams,
  ): Promise<CreateShipmentPackageResponse["data"]>;
  listPackages(
    shipmentId: string,
    params: ShipmentPackageParams,
  ): Promise<ListShipmentPackagesResponse["data"]>;
  getPackage(
    id: string,
    params: ShipmentPackageIdParams,
  ): Promise<GetShipmentPackageResponse["data"]>;
  updatePackage(
    id: string,
    input: UpdateShipmentPackageRequest,
    params: ShipmentPackageIdParams,
  ): Promise<ShipmentPackageActionResponse["data"]>;
  deletePackage(
    id: string,
    params: ShipmentPackageIdParams,
  ): Promise<ShipmentPackageActionResponse["data"]>;
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

    createPackage: (shipmentId, input, params) =>
      apiRequest<CreateShipmentPackageResponse["data"]>(config, {
        method: "POST",
        path: `/api/shipments/${shipmentId}/packages${toPackageQueryString(params)}`,
        body: input,
        accessToken: config.getAccessToken?.(),
      }),

    listPackages: (shipmentId, params) =>
      apiRequest<ListShipmentPackagesResponse["data"]>(config, {
        method: "GET",
        path: `/api/shipments/${shipmentId}/packages${toPackageQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      }),

    getPackage: (id, params) =>
      apiRequest<GetShipmentPackageResponse["data"]>(config, {
        method: "GET",
        path: `/api/shipment-packages/${id}${toPackageIdQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      }),

    updatePackage: (id, input, params) =>
      apiRequest<ShipmentPackageActionResponse["data"]>(config, {
        method: "PATCH",
        path: `/api/shipment-packages/${id}${toPackageIdQueryString(params)}`,
        body: input,
        accessToken: config.getAccessToken?.(),
      }),

    deletePackage: (id, params) =>
      apiRequest<ShipmentPackageActionResponse["data"]>(config, {
        method: "DELETE",
        path: `/api/shipment-packages/${id}${toPackageIdQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      }),
  };
}
