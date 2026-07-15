import {
  type ShipmentPackage as PrismaShipmentPackage,
  type PrismaClient,
  Prisma,
} from "@prisma/client";
import type { ShipmentPackage } from "@commerceflow/types";

import {
  generatePackageNumber,
  isUniquePackageNumberViolation,
} from "../services/package-number";
import type { CreateShipmentPackageRecord } from "./shipment-package-create-record";
import type { ShipmentPackageRepository } from "./shipment-package.repository";

function toShipmentPackage(record: PrismaShipmentPackage): ShipmentPackage {
  return {
    id: record.id,
    shipmentId: record.shipmentId,
    storeId: record.storeId,
    packageNumber: record.packageNumber,
    weight: record.weight.toString(),
    weightUnit: record.weightUnit,
    length: record.length.toString(),
    width: record.width.toString(),
    height: record.height.toString(),
    dimensionUnit: record.dimensionUnit,
    trackingNumber: record.trackingNumber ?? undefined,
    metadata:
      record.metadata && typeof record.metadata === "object"
        ? (record.metadata as Record<string, unknown>)
        : undefined,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export class PrismaShipmentPackageRepository
  implements ShipmentPackageRepository
{
  constructor(private readonly db: PrismaClient) {}

  async findById(
    storeId: string,
    id: string,
  ): Promise<ShipmentPackage | null> {
    const record = await this.db.shipmentPackage.findFirst({
      where: { id, storeId },
    });

    return record ? toShipmentPackage(record) : null;
  }

  async listByShipmentId(
    storeId: string,
    shipmentId: string,
  ): Promise<readonly ShipmentPackage[]> {
    const records = await this.db.shipmentPackage.findMany({
      where: { storeId, shipmentId },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    });

    return records.map(toShipmentPackage);
  }

  async create(record: CreateShipmentPackageRecord): Promise<ShipmentPackage> {
    const maxAttempts = 5;

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      const packageNumber = record.packageNumber ?? generatePackageNumber();

      try {
        const created = await this.db.shipmentPackage.create({
          data: {
            storeId: record.storeId,
            shipmentId: record.shipmentId,
            packageNumber,
            weight: record.weight,
            weightUnit: record.weightUnit,
            length: record.length,
            width: record.width,
            height: record.height,
            dimensionUnit: record.dimensionUnit,
            trackingNumber: record.trackingNumber,
            metadata: record.metadata as Prisma.InputJsonValue | undefined,
          },
        });

        return toShipmentPackage(created);
      } catch (error) {
        if (isUniquePackageNumberViolation(error) && !record.packageNumber) {
          continue;
        }

        throw error;
      }
    }

    throw new Error("Failed to generate a unique package number");
  }

  async update(
    storeId: string,
    id: string,
    input: Parameters<ShipmentPackageRepository["update"]>[2],
  ): Promise<ShipmentPackage> {
    try {
      const updated = await this.db.shipmentPackage.update({
        where: { id, storeId },
        data: {
          weight: input.weight,
          weightUnit: input.weightUnit,
          length: input.length,
          width: input.width,
          height: input.height,
          dimensionUnit: input.dimensionUnit,
          trackingNumber: input.trackingNumber,
          metadata: input.metadata as Prisma.InputJsonValue | undefined,
        },
      });

      return toShipmentPackage(updated);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        throw new Error(`ShipmentPackage not found: ${id}`);
      }

      throw error;
    }
  }

  async delete(storeId: string, id: string): Promise<ShipmentPackage> {
    try {
      const deleted = await this.db.shipmentPackage.delete({
        where: { id, storeId },
      });

      return toShipmentPackage(deleted);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        throw new Error(`ShipmentPackage not found: ${id}`);
      }

      throw error;
    }
  }
}
