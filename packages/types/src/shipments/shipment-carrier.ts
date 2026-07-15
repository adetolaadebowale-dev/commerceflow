/** Shipment carrier identifiers for Sprint 7.2. */
export const SHIPMENT_CARRIERS = ["internal", "manual"] as const;

export type ShipmentCarrier = (typeof SHIPMENT_CARRIERS)[number];
