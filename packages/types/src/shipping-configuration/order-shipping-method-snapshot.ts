import type { ShipmentCarrier } from "../shipments/shipment-carrier";

/** Immutable shipping method snapshot captured on an order or invoice at checkout. */
export interface OrderShippingMethodSnapshot {
  readonly shippingMethodId: string;
  readonly shippingZoneId: string;
  readonly methodNameSnapshot: string;
  readonly zoneNameSnapshot: string;
  readonly carrierSnapshot: ShipmentCarrier;
  readonly flatRateSnapshot: string;
  readonly currencySnapshot: string;
  readonly shippingAmount: string;
}
