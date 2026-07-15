import type { ShipmentTrackingEvent } from "@commerceflow/types";

import type { CreateShipmentTrackingEventRecord } from "./shipment-tracking-create-record";
import type { ShipmentTrackingRepository } from "./shipment-tracking.repository";

export class MemoryShipmentTrackingRepository
  implements ShipmentTrackingRepository
{
  private readonly eventsById = new Map<string, ShipmentTrackingEvent>();

  async append(
    record: CreateShipmentTrackingEventRecord,
  ): Promise<ShipmentTrackingEvent> {
    const now = new Date().toISOString();
    const event: ShipmentTrackingEvent = {
      id: crypto.randomUUID(),
      storeId: record.storeId,
      shipmentId: record.shipmentId,
      statusSnapshot: record.statusSnapshot,
      eventType: record.eventType,
      description: record.description,
      location: record.location,
      metadata: record.metadata,
      createdAt: now,
    };

    this.eventsById.set(event.id, event);
    return event;
  }

  async listByShipmentId(
    storeId: string,
    shipmentId: string,
  ): Promise<readonly ShipmentTrackingEvent[]> {
    return [...this.eventsById.values()]
      .filter(
        (event) => event.storeId === storeId && event.shipmentId === shipmentId,
      )
      .sort(
        (left, right) =>
          left.createdAt.localeCompare(right.createdAt) ||
          left.id.localeCompare(right.id),
      );
  }
}
