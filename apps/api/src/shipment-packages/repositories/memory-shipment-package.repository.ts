import type { ShipmentPackage } from "@commerceflow/types";
import type { UpdateShipmentPackageInput } from "@commerceflow/validation";

import {
  generatePackageNumber,
} from "../services/package-number";
import type { CreateShipmentPackageRecord } from "./shipment-package-create-record";
import type { ShipmentPackageRepository } from "./shipment-package.repository";

export class MemoryShipmentPackageRepository
  implements ShipmentPackageRepository
{
  private readonly packagesById = new Map<string, ShipmentPackage>();
  private readonly packageNumbersByStore = new Map<string, Set<string>>();
  private transactionFailure: Error | null = null;

  setTransactionFailure(error: Error | null): void {
    this.transactionFailure = error;
  }

  async findById(
    storeId: string,
    id: string,
  ): Promise<ShipmentPackage | null> {
    const shipmentPackage = this.packagesById.get(id);

    if (!shipmentPackage || shipmentPackage.storeId !== storeId) {
      return null;
    }

    return shipmentPackage;
  }

  async listByShipmentId(
    storeId: string,
    shipmentId: string,
  ): Promise<readonly ShipmentPackage[]> {
    return [...this.packagesById.values()]
      .filter(
        (shipmentPackage) =>
          shipmentPackage.storeId === storeId &&
          shipmentPackage.shipmentId === shipmentId,
      )
      .sort(
        (left, right) =>
          left.createdAt.localeCompare(right.createdAt) ||
          left.id.localeCompare(right.id),
      );
  }

  async create(record: CreateShipmentPackageRecord): Promise<ShipmentPackage> {
    if (this.transactionFailure) {
      throw this.transactionFailure;
    }

    const maxAttempts = 5;

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      const packageNumber = record.packageNumber ?? generatePackageNumber();
      const storeNumbers =
        this.packageNumbersByStore.get(record.storeId) ?? new Set<string>();

      if (storeNumbers.has(packageNumber)) {
        if (record.packageNumber) {
          throw { code: "P2002" };
        }

        continue;
      }

      const now = new Date().toISOString();
      const shipmentPackage: ShipmentPackage = {
        id: crypto.randomUUID(),
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
        metadata: record.metadata,
        createdAt: now,
        updatedAt: now,
      };

      this.packagesById.set(shipmentPackage.id, shipmentPackage);
      storeNumbers.add(packageNumber);
      this.packageNumbersByStore.set(record.storeId, storeNumbers);

      return shipmentPackage;
    }

    throw new Error("Failed to generate a unique package number");
  }

  async update(
    storeId: string,
    id: string,
    input: UpdateShipmentPackageInput,
  ): Promise<ShipmentPackage> {
    if (this.transactionFailure) {
      throw this.transactionFailure;
    }

    const existing = await this.findById(storeId, id);

    if (!existing) {
      throw new Error(`ShipmentPackage not found: ${id}`);
    }

    const updated: ShipmentPackage = {
      ...existing,
      weight: input.weight ?? existing.weight,
      weightUnit: input.weightUnit ?? existing.weightUnit,
      length: input.length ?? existing.length,
      width: input.width ?? existing.width,
      height: input.height ?? existing.height,
      dimensionUnit: input.dimensionUnit ?? existing.dimensionUnit,
      trackingNumber:
        input.trackingNumber === null
          ? undefined
          : input.trackingNumber ?? existing.trackingNumber,
      metadata: input.metadata ?? existing.metadata,
      updatedAt: new Date().toISOString(),
    };

    this.packagesById.set(id, updated);
    return updated;
  }

  async delete(storeId: string, id: string): Promise<ShipmentPackage> {
    if (this.transactionFailure) {
      throw this.transactionFailure;
    }

    const existing = await this.findById(storeId, id);

    if (!existing) {
      throw new Error(`ShipmentPackage not found: ${id}`);
    }

    this.packagesById.delete(id);

    const storeNumbers =
      this.packageNumbersByStore.get(storeId) ?? new Set<string>();
    storeNumbers.delete(existing.packageNumber);
    this.packageNumbersByStore.set(storeId, storeNumbers);

    return existing;
  }
}
