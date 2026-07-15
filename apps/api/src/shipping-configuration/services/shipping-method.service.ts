import { Prisma } from "@prisma/client";
import type { ShippingMethod, ShippingZone } from "@commerceflow/types";
import type {
  CreateShippingMethodInput,
  ListShippingMethodsQuery,
  UpdateShippingMethodInput,
} from "@commerceflow/validation";

import {
  getDomainEventPublisher,
  type DomainEventPublisher,
} from "@/domain-events";
import { SHIPPING_METHOD_ERROR_CODES, ShippingMethodError } from "../errors";
import {
  getShippingMethodRepository,
  getShippingZoneRepository,
  type ShippingMethodRepository,
  type ShippingZoneRepository,
} from "../repositories";

export interface ShippingMethodServiceDependencies {
  readonly shippingMethodRepository?: ShippingMethodRepository;
  readonly shippingZoneRepository?: ShippingZoneRepository;
  readonly domainEventPublisher?: DomainEventPublisher;
}

export class ShippingMethodService {
  private readonly shippingMethodRepository: ShippingMethodRepository;
  private readonly shippingZoneRepository: ShippingZoneRepository;
  private readonly domainEventPublisher: DomainEventPublisher;

  constructor(dependencies: ShippingMethodServiceDependencies = {}) {
    this.shippingMethodRepository =
      dependencies.shippingMethodRepository ?? getShippingMethodRepository();
    this.shippingZoneRepository =
      dependencies.shippingZoneRepository ?? getShippingZoneRepository();
    this.domainEventPublisher =
      dependencies.domainEventPublisher ?? getDomainEventPublisher();
  }

  async createShippingMethod(
    input: CreateShippingMethodInput,
  ): Promise<ShippingMethod> {
    this.assertFlatRate(input.flatRate);

    const zone = await this.requireActiveZoneForMethod(
      input.storeId,
      input.shippingZoneId,
      input.status,
    );

    if (!zone) {
      throw new ShippingMethodError(
        SHIPPING_METHOD_ERROR_CODES.ZONE_NOT_FOUND,
        "Shipping zone not found",
        404,
      );
    }

    try {
      const shippingMethod = await this.shippingMethodRepository.create(input);
      this.domainEventPublisher.publishShippingMethodCreated(shippingMethod);
      return shippingMethod;
    } catch (error) {
      throw this.mapRepositoryError(error);
    }
  }

  async updateShippingMethod(
    storeId: string,
    id: string,
    input: UpdateShippingMethodInput,
  ): Promise<ShippingMethod> {
    const existing = await this.requireShippingMethod(storeId, id);
    const effectiveStatus = input.status ?? existing.status;
    const effectiveZoneId = input.shippingZoneId ?? existing.shippingZoneId;

    if (input.flatRate !== undefined) {
      this.assertFlatRate(input.flatRate);
    }

    const zone = await this.requireActiveZoneForMethod(
      storeId,
      effectiveZoneId,
      effectiveStatus,
    );

    if (!zone) {
      throw new ShippingMethodError(
        SHIPPING_METHOD_ERROR_CODES.ZONE_NOT_FOUND,
        "Shipping zone not found",
        404,
      );
    }

    try {
      const shippingMethod = await this.shippingMethodRepository.update(
        storeId,
        id,
        input,
      );
      this.domainEventPublisher.publishShippingMethodUpdated(shippingMethod);
      return shippingMethod;
    } catch (error) {
      throw this.mapRepositoryError(error);
    }
  }

  async getShippingMethod(storeId: string, id: string): Promise<ShippingMethod> {
    const shippingMethod = await this.shippingMethodRepository.findById(
      storeId,
      id,
    );

    if (!shippingMethod) {
      throw new ShippingMethodError(
        SHIPPING_METHOD_ERROR_CODES.NOT_FOUND,
        "Shipping method not found",
        404,
      );
    }

    return shippingMethod;
  }

  async listShippingMethods(query: ListShippingMethodsQuery) {
    return this.shippingMethodRepository.list(query);
  }

  async softDeleteShippingMethod(
    storeId: string,
    id: string,
  ): Promise<ShippingMethod> {
    await this.requireShippingMethod(storeId, id);

    try {
      const shippingMethod = await this.shippingMethodRepository.softDelete(
        storeId,
        id,
      );
      this.domainEventPublisher.publishShippingMethodDeleted(shippingMethod);
      return shippingMethod;
    } catch (error) {
      throw this.mapRepositoryError(error);
    }
  }

  private assertFlatRate(flatRate: string): void {
    const numericValue = Number.parseFloat(flatRate);

    if (numericValue < 0) {
      throw new ShippingMethodError(
        SHIPPING_METHOD_ERROR_CODES.VALIDATION_ERROR,
        "Flat rate must be greater than or equal to 0",
        400,
      );
    }
  }

  private async requireActiveZoneForMethod(
    storeId: string,
    shippingZoneId: string,
    status: ShippingMethod["status"],
  ): Promise<ShippingZone | null> {
    const zone = await this.shippingZoneRepository.findById(
      storeId,
      shippingZoneId,
    );

    if (!zone) {
      return null;
    }

    if (status === "active" && zone.status !== "active") {
      throw new ShippingMethodError(
        SHIPPING_METHOD_ERROR_CODES.INACTIVE_ZONE_REQUIRED,
        "Active shipping methods require an active shipping zone",
        409,
      );
    }

    return zone;
  }

  private async requireShippingMethod(
    storeId: string,
    id: string,
  ): Promise<ShippingMethod> {
    const shippingMethod = await this.shippingMethodRepository.findById(
      storeId,
      id,
    );

    if (!shippingMethod) {
      throw new ShippingMethodError(
        SHIPPING_METHOD_ERROR_CODES.NOT_FOUND,
        "Shipping method not found",
        404,
      );
    }

    return shippingMethod;
  }

  private mapRepositoryError(error: unknown): ShippingMethodError {
    if (
      error instanceof Error &&
      error.message.startsWith("Shipping method not found:")
    ) {
      return new ShippingMethodError(
        SHIPPING_METHOD_ERROR_CODES.NOT_FOUND,
        "Shipping method not found",
        404,
      );
    }

    if (error instanceof ShippingMethodError) {
      return error;
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2003") {
        return new ShippingMethodError(
          SHIPPING_METHOD_ERROR_CODES.ZONE_NOT_FOUND,
          "Shipping zone not found",
          404,
        );
      }

      return new ShippingMethodError(
        SHIPPING_METHOD_ERROR_CODES.TRANSACTION_FAILED,
        "Shipping method transaction failed",
        500,
      );
    }

    return new ShippingMethodError(
      SHIPPING_METHOD_ERROR_CODES.TRANSACTION_FAILED,
      "Shipping method transaction failed",
      500,
    );
  }
}

export const shippingMethodService = new ShippingMethodService();
