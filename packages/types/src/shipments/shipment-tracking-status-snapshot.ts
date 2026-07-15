import type { ShipmentStatus } from "./shipment-status";

/** Immutable snapshot of shipment.status captured when a tracking event is recorded. */
export type ShipmentTrackingStatusSnapshot = ShipmentStatus;
