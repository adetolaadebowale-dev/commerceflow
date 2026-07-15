import { PrismaShipmentPackageRepository } from "./prisma-shipment-package.repository";
import type { ShipmentPackageRepository } from "./shipment-package.repository";
import { prisma } from "@/lib/prisma";

const shipmentPackageRepository: ShipmentPackageRepository =
  new PrismaShipmentPackageRepository(prisma);

export function getShipmentPackageRepository(): ShipmentPackageRepository {
  return shipmentPackageRepository;
}

export type { ShipmentPackageRepository } from "./shipment-package.repository";
export type { CreateShipmentPackageRecord } from "./shipment-package-create-record";
