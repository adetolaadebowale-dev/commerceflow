import type { Shipment, ShipmentPackage, ShipmentTrackingEvent } from "@commerceflow/types";
import type {
  CreateShipmentInput,
  CreateShipmentTrackingEventInput,
  CreateShipmentPackageInput,
  ListOrderShipmentsQuery,
  ShipmentIdQuery,
  ShipmentPackageIdQuery,
  ShipmentPackageQuery,
  ShipmentTrackingQuery,
  UpdateShipmentPackageInput,
} from "@commerceflow/validation";

import type { ApiSuccessResponse } from "../common/api-response";

export type ShipmentStoreScopedParams = ShipmentIdQuery;
export type ListOrderShipmentsParams = ListOrderShipmentsQuery;
export type CreateShipmentRequest = CreateShipmentInput;

export type CreateShipmentResponse = ApiSuccessResponse<{ shipment: Shipment }>;
export type GetShipmentResponse = ApiSuccessResponse<{ shipment: Shipment }>;
export type ListOrderShipmentsResponse = ApiSuccessResponse<{
  shipments: readonly Shipment[];
}>;
export type ShipmentActionResponse = ApiSuccessResponse<{ shipment: Shipment }>;
export type CreateShipmentTrackingEventRequest = CreateShipmentTrackingEventInput;
export type ShipmentTrackingParams = ShipmentTrackingQuery;
export type CreateShipmentTrackingEventResponse = ApiSuccessResponse<{
  trackingEvent: ShipmentTrackingEvent;
}>;
export type ListShipmentTrackingEventsResponse = ApiSuccessResponse<{
  trackingEvents: readonly ShipmentTrackingEvent[];
}>;
export type CreateShipmentPackageRequest = CreateShipmentPackageInput;
export type UpdateShipmentPackageRequest = UpdateShipmentPackageInput;
export type ShipmentPackageParams = ShipmentPackageQuery;
export type ShipmentPackageIdParams = ShipmentPackageIdQuery;
export type CreateShipmentPackageResponse = ApiSuccessResponse<{
  shipmentPackage: ShipmentPackage;
}>;
export type GetShipmentPackageResponse = ApiSuccessResponse<{
  shipmentPackage: ShipmentPackage;
}>;
export type ListShipmentPackagesResponse = ApiSuccessResponse<{
  packages: readonly ShipmentPackage[];
}>;
export type ShipmentPackageActionResponse = ApiSuccessResponse<{
  shipmentPackage: ShipmentPackage;
}>;
