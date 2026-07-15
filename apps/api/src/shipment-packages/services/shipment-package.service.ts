import type { Shipment, ShipmentPackage } from "@commerceflow/types";
import type {
  CreateShipmentPackageInput,
  ShipmentPackageQuery,
  UpdateShipmentPackageInput,
} from "@commerceflow/validation";

import {
  getDomainEventPublisher,
  type DomainEventPublisher,
} from "@/domain-events";
import {
  getShipmentRepository,
  type ShipmentRepository,
} from "@/shipments/repositories";
import { SHIPMENT_PACKAGE_ERROR_CODES, ShipmentPackageError } from "../errors";
import {
  getShipmentPackageRepository,
  type ShipmentPackageRepository,
} from "../repositories";

export interface ShipmentPackageServiceDependencies {
  readonly shipmentPackageRepository?: ShipmentPackageRepository;
  readonly shipmentRepository?: ShipmentRepository;
  readonly domainEventPublisher?: DomainEventPublisher;
}

export class ShipmentPackageService {
  private readonly shipmentPackageRepository: ShipmentPackageRepository;
  private readonly shipmentRepository: ShipmentRepository;
  private readonly domainEventPublisher: DomainEventPublisher;

  constructor(dependencies: ShipmentPackageServiceDependencies = {}) {
    this.shipmentPackageRepository =
      dependencies.shipmentPackageRepository ??
      getShipmentPackageRepository();
    this.shipmentRepository =
      dependencies.shipmentRepository ?? getShipmentRepository();
    this.domainEventPublisher =
      dependencies.domainEventPublisher ?? getDomainEventPublisher();
  }

  async createPackage(
    storeId: string,
    shipmentId: string,
    input: CreateShipmentPackageInput,
  ): Promise<ShipmentPackage> {
    const shipment = await this.requireMutableShipment(storeId, shipmentId);

    try {
      const shipmentPackage = await this.shipmentPackageRepository.create({
        ...input,
        storeId,
        shipmentId,
      });

      this.domainEventPublisher.publishShipmentPackageCreated(
        shipment,
        shipmentPackage,
      );

      return shipmentPackage;
    } catch (error) {
      throw this.mapRepositoryError(error);
    }
  }

  async listPackages(
    query: ShipmentPackageQuery,
    shipmentId: string,
  ): Promise<readonly ShipmentPackage[]> {
    await this.requireShipment(query.storeId, shipmentId);

    return this.shipmentPackageRepository.listByShipmentId(
      query.storeId,
      shipmentId,
    );
  }

  async getPackage(storeId: string, id: string): Promise<ShipmentPackage> {
    const shipmentPackage = await this.shipmentPackageRepository.findById(
      storeId,
      id,
    );

    if (!shipmentPackage) {
      throw new ShipmentPackageError(
        SHIPMENT_PACKAGE_ERROR_CODES.PACKAGE_NOT_FOUND,
        "Shipment package not found",
        404,
      );
    }

    return shipmentPackage;
  }

  async updatePackage(
    storeId: string,
    id: string,
    input: UpdateShipmentPackageInput,
  ): Promise<ShipmentPackage> {
    const existing = await this.getPackage(storeId, id);
    const shipment = await this.requireMutableShipment(
      storeId,
      existing.shipmentId,
    );

    try {
      const updated = await this.shipmentPackageRepository.update(
        storeId,
        id,
        input,
      );

      this.domainEventPublisher.publishShipmentPackageUpdated(
        shipment,
        updated,
      );

      return updated;
    } catch (error) {
      throw this.mapRepositoryError(error);
    }
  }

  async deletePackage(storeId: string, id: string): Promise<ShipmentPackage> {
    const existing = await this.getPackage(storeId, id);
    const shipment = await this.requireMutableShipment(
      storeId,
      existing.shipmentId,
    );

    try {
      const deleted = await this.shipmentPackageRepository.delete(storeId, id);

      this.domainEventPublisher.publishShipmentPackageDeleted(
        shipment,
        deleted,
      );

      return deleted;
    } catch (error) {
      throw this.mapRepositoryError(error);
    }
  }

  private async requireShipment(
    storeId: string,
    shipmentId: string,
  ): Promise<Shipment> {
    const shipment = await this.shipmentRepository.findById(storeId, shipmentId);

    if (!shipment) {
      throw new ShipmentPackageError(
        SHIPMENT_PACKAGE_ERROR_CODES.SHIPMENT_NOT_FOUND,
        "Shipment not found",
        404,
      );
    }

    return shipment;
  }

  private async requireMutableShipment(
    storeId: string,
    shipmentId: string,
  ): Promise<Shipment> {
    const shipment = await this.requireShipment(storeId, shipmentId);
    this.assertShipmentMutable(shipment);
    return shipment;
  }

  private assertShipmentMutable(shipment: Shipment): void {
    if (shipment.status === "delivered" || shipment.status === "cancelled") {
      throw new ShipmentPackageError(
        SHIPMENT_PACKAGE_ERROR_CODES.SHIPMENT_NOT_MUTABLE,
        "Cannot modify packages on delivered or cancelled shipments",
        409,
      );
    }
  }

  private mapRepositoryError(error: unknown): ShipmentPackageError {
    if (error instanceof ShipmentPackageError) {
      return error;
    }

    if (
      error instanceof Error &&
      error.message.startsWith("ShipmentPackage not found:")
    ) {
      return new ShipmentPackageError(
        SHIPMENT_PACKAGE_ERROR_CODES.PACKAGE_NOT_FOUND,
        "Shipment package not found",
        404,
      );
    }

    return new ShipmentPackageError(
      SHIPMENT_PACKAGE_ERROR_CODES.TRANSACTION_FAILED,
      "Shipment package transaction failed",
      500,
    );
  }
}

export const shipmentPackageService = new ShipmentPackageService();
