import type { ShipmentCarrier } from "../shipment-carrier";
import type { ShipmentStatus } from "../shipment-status";

/** Input for initializing a carrier session before shipment persistence. */
export interface ShipmentInitializeRequest {
  readonly storeId: string;
  readonly orderId: string;
  readonly shipmentNumber: string;
  readonly carrier: ShipmentCarrier;
  readonly trackingNumber?: string;
  readonly shippingRecipientName: string;
  readonly shippingPhone: string;
  readonly shippingAddressLine1: string;
  readonly shippingAddressLine2?: string;
  readonly shippingCity: string;
  readonly shippingStateProvince: string;
  readonly shippingPostalCode: string;
  readonly shippingCountryCode: string;
  readonly metadata?: Record<string, unknown>;
}

/** Context shared by gateway operations after a shipment record exists. */
export interface ShipmentDispatchContext {
  readonly storeId: string;
  readonly orderId: string;
  readonly shipmentId: string;
  readonly shipmentNumber: string;
  readonly carrier: ShipmentCarrier;
  readonly trackingNumber?: string;
  readonly status: ShipmentStatus;
  readonly shippingRecipientName: string;
  readonly shippingPhone: string;
  readonly shippingAddressLine1: string;
  readonly shippingAddressLine2?: string;
  readonly shippingCity: string;
  readonly shippingStateProvince: string;
  readonly shippingPostalCode: string;
  readonly shippingCountryCode: string;
  readonly metadata?: Record<string, unknown>;
}
