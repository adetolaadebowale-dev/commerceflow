import type {
  ShipmentTrackingEventType,
  ShipmentTrackingStatusSnapshot,
} from "@commerceflow/types";

export interface CreateShipmentTrackingEventRecord {
  readonly storeId: string;
  readonly shipmentId: string;
  readonly statusSnapshot: ShipmentTrackingStatusSnapshot;
  readonly eventType: ShipmentTrackingEventType;
  readonly description: string;
  readonly location?: string;
  readonly metadata?: Record<string, unknown>;
}
