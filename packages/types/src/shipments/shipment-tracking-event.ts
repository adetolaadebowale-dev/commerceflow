import type { ShipmentTrackingEventType } from "./shipment-tracking-event-type";
import type { ShipmentTrackingStatusSnapshot } from "./shipment-tracking-status-snapshot";

/** Append-only shipment tracking timeline entry. */
export interface ShipmentTrackingEvent {
  readonly id: string;
  readonly shipmentId: string;
  readonly storeId: string;
  readonly statusSnapshot: ShipmentTrackingStatusSnapshot;
  readonly eventType: ShipmentTrackingEventType;
  readonly description: string;
  readonly location?: string;
  readonly metadata?: Record<string, unknown>;
  readonly createdAt: string;
}
