/** Shipment tracking timeline event type values. */
export const SHIPMENT_TRACKING_EVENT_TYPES = [
  "status_update",
  "location_update",
  "carrier_update",
  "delivery_attempt",
  "note",
  "exception",
] as const;

export type ShipmentTrackingEventType =
  (typeof SHIPMENT_TRACKING_EVENT_TYPES)[number];
