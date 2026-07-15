import type { ShippingZoneStatus } from "./shipping-zone-status";

/** Store-scoped shipping zone grouping ISO country codes. */
export interface ShippingZone {
  readonly id: string;
  readonly storeId: string;
  readonly name: string;
  readonly countries: readonly string[];
  readonly status: ShippingZoneStatus;
  readonly createdAt: string;
  readonly updatedAt: string;
}
