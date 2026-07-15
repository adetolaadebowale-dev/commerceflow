import {
  type ShipmentTrackingEvent as PrismaShipmentTrackingEvent,
  type PrismaClient,
  Prisma,
} from "@prisma/client";
import type { ShipmentTrackingEvent } from "@commerceflow/types";

import type { CreateShipmentTrackingEventRecord } from "./shipment-tracking-create-record";
import type { ShipmentTrackingRepository } from "./shipment-tracking.repository";

function toShipmentTrackingEvent(
  record: PrismaShipmentTrackingEvent,
): ShipmentTrackingEvent {
  return {
    id: record.id,
    shipmentId: record.shipmentId,
    storeId: record.storeId,
    statusSnapshot: record.statusSnapshot,
    eventType: record.eventType,
    description: record.description,
    location: record.location ?? undefined,
    metadata:
      record.metadata && typeof record.metadata === "object"
        ? (record.metadata as Record<string, unknown>)
        : undefined,
    createdAt: record.createdAt.toISOString(),
  };
}

export class PrismaShipmentTrackingRepository
  implements ShipmentTrackingRepository
{
  constructor(private readonly db: PrismaClient) {}

  async append(
    record: CreateShipmentTrackingEventRecord,
  ): Promise<ShipmentTrackingEvent> {
    const created = await this.db.shipmentTrackingEvent.create({
      data: {
        storeId: record.storeId,
        shipmentId: record.shipmentId,
        statusSnapshot: record.statusSnapshot,
        eventType: record.eventType,
        description: record.description,
        location: record.location,
        metadata: record.metadata as Prisma.InputJsonValue | undefined,
      },
    });

    return toShipmentTrackingEvent(created);
  }

  async listByShipmentId(
    storeId: string,
    shipmentId: string,
  ): Promise<readonly ShipmentTrackingEvent[]> {
    const records = await this.db.shipmentTrackingEvent.findMany({
      where: { storeId, shipmentId },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    });

    return records.map(toShipmentTrackingEvent);
  }
}
