import type { ShipmentCarrier } from "./shipment-carrier";
import type { ShipmentStatus } from "./shipment-status";

/** Store-scoped shipment linked to a fulfilled order with snapshotted shipping address. */
export interface Shipment {
  readonly id: string;
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
  readonly status: ShipmentStatus;
  readonly shippedAt?: string;
  readonly deliveredAt?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}
