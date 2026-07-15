import { PrismaShipmentRepository } from "./prisma-shipment.repository";
import type { ShipmentRepository } from "./shipment.repository";
import { prisma } from "@/lib/prisma";

const shipmentRepository: ShipmentRepository = new PrismaShipmentRepository(
  prisma,
);

export function getShipmentRepository(): ShipmentRepository {
  return shipmentRepository;
}

export type { ShipmentRepository } from "./shipment.repository";
export type {
  CreateShipmentRecord,
  ShipmentStatusTransitionInput,
} from "./shipment-create-record";
