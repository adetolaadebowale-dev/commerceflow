import type { ShipmentCarrier, ShipmentStatus } from "@commerceflow/types";

export interface CreateShipmentRecord {
  readonly storeId: string;
  readonly orderId: string;
  readonly shipmentNumber?: string;
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
}

export interface ShipmentStatusTransitionInput {
  readonly fromStatus: ShipmentStatus;
  readonly toStatus: ShipmentStatus;
  readonly shippedAt?: string;
  readonly deliveredAt?: string;
  readonly trackingNumber?: string;
}
