import type { ShipmentCarrier } from "../shipments/shipment-carrier";
import type { ShippingMethodStatus } from "./shipping-method-status";

/** Store-scoped flat-rate shipping method linked to a zone. */
export interface ShippingMethod {
  readonly id: string;
  readonly storeId: string;
  readonly shippingZoneId: string;
  readonly name: string;
  readonly description?: string;
  readonly carrier: ShipmentCarrier;
  readonly flatRate: string;
  readonly currency: string;
  readonly status: ShippingMethodStatus;
  readonly createdAt: string;
  readonly updatedAt: string;
}
