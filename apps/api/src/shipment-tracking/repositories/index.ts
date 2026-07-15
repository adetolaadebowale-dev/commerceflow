import { PrismaShipmentTrackingRepository } from "./prisma-shipment-tracking.repository";
import type { ShipmentTrackingRepository } from "./shipment-tracking.repository";
import { prisma } from "@/lib/prisma";

const shipmentTrackingRepository: ShipmentTrackingRepository =
  new PrismaShipmentTrackingRepository(prisma);

export function getShipmentTrackingRepository(): ShipmentTrackingRepository {
  return shipmentTrackingRepository;
}

export type { ShipmentTrackingRepository } from "./shipment-tracking.repository";
export type { CreateShipmentTrackingEventRecord } from "./shipment-tracking-create-record";
