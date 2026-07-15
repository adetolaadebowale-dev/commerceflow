import { Prisma } from "@prisma/client";
import type { ShippingZone } from "@commerceflow/types";
import type {
  CreateShippingZoneInput,
  ListShippingZonesQuery,
  UpdateShippingZoneInput,
} from "@commerceflow/validation";

import {
  getDomainEventPublisher,
  type DomainEventPublisher,
} from "@/domain-events";
import { SHIPPING_ZONE_ERROR_CODES, ShippingZoneError } from "../errors";
import {
  getShippingMethodRepository,
  getShippingZoneRepository,
  type ShippingMethodRepository,
  type ShippingZoneRepository,
} from "../repositories";

export interface ShippingZoneServiceDependencies {
  readonly shippingZoneRepository?: ShippingZoneRepository;
  readonly shippingMethodRepository?: ShippingMethodRepository;
  readonly domainEventPublisher?: DomainEventPublisher;
}

export class ShippingZoneService {
  private readonly shippingZoneRepository: ShippingZoneRepository;
  private readonly shippingMethodRepository: ShippingMethodRepository;
  private readonly domainEventPublisher: DomainEventPublisher;

  constructor(dependencies: ShippingZoneServiceDependencies = {}) {
    this.shippingZoneRepository =
      dependencies.shippingZoneRepository ?? getShippingZoneRepository();
    this.shippingMethodRepository =
      dependencies.shippingMethodRepository ?? getShippingMethodRepository();
    this.domainEventPublisher =
      dependencies.domainEventPublisher ?? getDomainEventPublisher();
  }

  async createShippingZone(
    input: CreateShippingZoneInput,
  ): Promise<ShippingZone> {
    try {
      const shippingZone = await this.shippingZoneRepository.create(input);
      this.domainEventPublisher.publishShippingZoneCreated(shippingZone);
      return shippingZone;
    } catch (error) {
      throw this.mapRepositoryError(error);
    }
  }

  async updateShippingZone(
    storeId: string,
    id: string,
    input: UpdateShippingZoneInput,
  ): Promise<ShippingZone> {
    const existing = await this.requireShippingZone(storeId, id);

    if (input.status === "inactive" && existing.status === "active") {
      await this.assertNoActiveMethods(storeId, id);
    }

    try {
      const shippingZone = await this.shippingZoneRepository.update(
        storeId,
        id,
        input,
      );
      this.domainEventPublisher.publishShippingZoneUpdated(shippingZone);
      return shippingZone;
    } catch (error) {
      throw this.mapRepositoryError(error);
    }
  }

  async getShippingZone(storeId: string, id: string): Promise<ShippingZone> {
    const shippingZone = await this.shippingZoneRepository.findById(storeId, id);

    if (!shippingZone) {
      throw new ShippingZoneError(
        SHIPPING_ZONE_ERROR_CODES.NOT_FOUND,
        "Shipping zone not found",
        404,
      );
    }

    return shippingZone;
  }

  async listShippingZones(query: ListShippingZonesQuery) {
    return this.shippingZoneRepository.list(query);
  }

  async softDeleteShippingZone(
    storeId: string,
    id: string,
  ): Promise<ShippingZone> {
    await this.requireShippingZone(storeId, id);
    await this.assertNoActiveMethods(storeId, id);

    try {
      const shippingZone = await this.shippingZoneRepository.softDelete(
        storeId,
        id,
      );
      this.domainEventPublisher.publishShippingZoneDeleted(shippingZone);
      return shippingZone;
    } catch (error) {
      throw this.mapRepositoryError(error);
    }
  }

  private async assertNoActiveMethods(
    storeId: string,
    shippingZoneId: string,
  ): Promise<void> {
    const activeCount = await this.shippingMethodRepository.countActiveByZoneId(
      storeId,
      shippingZoneId,
    );

    if (activeCount > 0) {
      throw new ShippingZoneError(
        SHIPPING_ZONE_ERROR_CODES.HAS_ACTIVE_METHODS,
        "Shipping zone cannot be deleted or deactivated while active methods exist",
        409,
      );
    }
  }

  private async requireShippingZone(
    storeId: string,
    id: string,
  ): Promise<ShippingZone> {
    const shippingZone = await this.shippingZoneRepository.findById(storeId, id);

    if (!shippingZone) {
      throw new ShippingZoneError(
        SHIPPING_ZONE_ERROR_CODES.NOT_FOUND,
        "Shipping zone not found",
        404,
      );
    }

    return shippingZone;
  }

  private mapRepositoryError(error: unknown): ShippingZoneError {
    if (
      error instanceof Error &&
      error.message.startsWith("Shipping zone not found:")
    ) {
      return new ShippingZoneError(
        SHIPPING_ZONE_ERROR_CODES.NOT_FOUND,
        "Shipping zone not found",
        404,
      );
    }

    if (error instanceof ShippingZoneError) {
      return error;
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return new ShippingZoneError(
        SHIPPING_ZONE_ERROR_CODES.TRANSACTION_FAILED,
        "Shipping zone transaction failed",
        500,
      );
    }

    return new ShippingZoneError(
      SHIPPING_ZONE_ERROR_CODES.TRANSACTION_FAILED,
      "Shipping zone transaction failed",
      500,
    );
  }
}

export const shippingZoneService = new ShippingZoneService();
