import type { Shipment } from "@commerceflow/types";
import type {
  CreateShipmentInput,
  ListOrderShipmentsQuery,
  ShipmentIdQuery,
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
