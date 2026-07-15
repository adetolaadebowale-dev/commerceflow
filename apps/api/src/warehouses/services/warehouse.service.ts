import { Prisma } from "@prisma/client";
import type { Warehouse, WarehouseStatus } from "@commerceflow/types";
import type {
  CreateWarehouseInput,
  ListWarehousesQuery,
  UpdateWarehouseInput,
} from "@commerceflow/validation";

import {
  getDomainEventPublisher,
  type DomainEventPublisher,
} from "@/domain-events";
import { WAREHOUSE_ERROR_CODES, WarehouseError } from "../errors";
import {
  getWarehouseRepository,
  type WarehouseRepository,
} from "../repositories";

export interface WarehouseServiceDependencies {
  readonly warehouseRepository?: WarehouseRepository;
  readonly domainEventPublisher?: DomainEventPublisher;
}

export class WarehouseService {
  private readonly warehouseRepository: WarehouseRepository;
  private readonly domainEventPublisher: DomainEventPublisher;

  constructor(dependencies: WarehouseServiceDependencies = {}) {
    this.warehouseRepository =
      dependencies.warehouseRepository ?? getWarehouseRepository();
    this.domainEventPublisher =
      dependencies.domainEventPublisher ?? getDomainEventPublisher();
  }

  async createWarehouse(input: CreateWarehouseInput): Promise<Warehouse> {
    const count = await this.warehouseRepository.countActiveByStoreId(
      input.storeId,
    );
    const willBeDefault = input.isDefault || count === 0;

    this.assertDefaultIsActive(willBeDefault, input.status);

    try {
      const warehouse = await this.warehouseRepository.create(input);
      this.domainEventPublisher.publishWarehouseCreated(warehouse);

      if (warehouse.status === "active") {
        this.domainEventPublisher.publishWarehouseActivated(
          warehouse,
          "inactive",
        );
      }

      return warehouse;
    } catch (error) {
      throw this.mapRepositoryError(error);
    }
  }

  async updateWarehouse(
    storeId: string,
    id: string,
    input: UpdateWarehouseInput,
  ): Promise<Warehouse> {
    const existing = await this.requireWarehouse(storeId, id);

    if (input.isDefault === false && existing.isDefault) {
      throw new WarehouseError(
        WAREHOUSE_ERROR_CODES.DEFAULT_WAREHOUSE_REQUIRED,
        "Store must have a default warehouse",
        409,
      );
    }

    const willBeDefault = input.isDefault ?? existing.isDefault;
    const willBeActive = input.status ?? existing.status;

    if (willBeDefault && willBeActive === "inactive") {
      throw new WarehouseError(
        WAREHOUSE_ERROR_CODES.VALIDATION_ERROR,
        "Default warehouse must be active",
        400,
      );
    }

    if (
      input.status === "inactive" &&
      (existing.isDefault || input.isDefault === true)
    ) {
      throw new WarehouseError(
        WAREHOUSE_ERROR_CODES.CANNOT_DEACTIVATE_DEFAULT,
        "Cannot deactivate default warehouse",
        409,
      );
    }

    const { status, ...fieldUpdates } = input;
    let warehouse = existing;

    if (Object.keys(fieldUpdates).length > 0) {
      try {
        warehouse = await this.warehouseRepository.update(
          storeId,
          id,
          fieldUpdates,
        );
        this.domainEventPublisher.publishWarehouseUpdated(warehouse);
      } catch (error) {
        throw this.mapRepositoryError(error);
      }
    }

    if (status === "active" && warehouse.status !== "active") {
      return this.activateWarehouse(storeId, id);
    }

    if (status === "inactive" && warehouse.status === "active") {
      return this.deactivateWarehouse(storeId, id);
    }

    return warehouse;
  }

  async getWarehouse(storeId: string, id: string): Promise<Warehouse> {
    const warehouse = await this.warehouseRepository.findById(storeId, id);

    if (!warehouse) {
      throw new WarehouseError(
        WAREHOUSE_ERROR_CODES.NOT_FOUND,
        "Warehouse not found",
        404,
      );
    }

    return warehouse;
  }

  async getDefaultWarehouse(storeId: string): Promise<Warehouse | null> {
    return this.warehouseRepository.findDefaultByStoreId(storeId);
  }

  async listWarehouses(query: ListWarehousesQuery) {
    return this.warehouseRepository.list(query);
  }

  async activateWarehouse(storeId: string, id: string): Promise<Warehouse> {
    const existing = await this.requireWarehouse(storeId, id);

    if (existing.status === "active") {
      return existing;
    }

    try {
      const warehouse = await this.warehouseRepository.activate(storeId, id);
      this.domainEventPublisher.publishWarehouseActivated(
        warehouse,
        existing.status,
      );
      return warehouse;
    } catch (error) {
      throw this.mapRepositoryError(error);
    }
  }

  async deactivateWarehouse(storeId: string, id: string): Promise<Warehouse> {
    const existing = await this.requireWarehouse(storeId, id);

    if (existing.status === "inactive") {
      return existing;
    }

    if (existing.isDefault) {
      throw new WarehouseError(
        WAREHOUSE_ERROR_CODES.CANNOT_DEACTIVATE_DEFAULT,
        "Cannot deactivate default warehouse",
        409,
      );
    }

    try {
      const warehouse = await this.warehouseRepository.deactivate(storeId, id);
      this.domainEventPublisher.publishWarehouseDeactivated(
        warehouse,
        existing.status,
      );
      return warehouse;
    } catch (error) {
      throw this.mapRepositoryError(error);
    }
  }

  async softDeleteWarehouse(storeId: string, id: string): Promise<Warehouse> {
    const existing = await this.requireWarehouse(storeId, id);

    if (existing.isDefault) {
      throw new WarehouseError(
        WAREHOUSE_ERROR_CODES.CANNOT_DELETE_DEFAULT,
        "Cannot delete default warehouse",
        409,
      );
    }

    try {
      const warehouse = await this.warehouseRepository.softDelete(storeId, id);
      this.domainEventPublisher.publishWarehouseDeleted(warehouse);

      if (existing.status === "active") {
        this.domainEventPublisher.publishWarehouseDeactivated(
          warehouse,
          existing.status,
        );
      }

      return warehouse;
    } catch (error) {
      throw this.mapRepositoryError(error);
    }
  }

  private assertDefaultIsActive(
    willBeDefault: boolean,
    status: WarehouseStatus,
  ): void {
    if (willBeDefault && status === "inactive") {
      throw new WarehouseError(
        WAREHOUSE_ERROR_CODES.VALIDATION_ERROR,
        "Default warehouse must be active",
        400,
      );
    }
  }

  private async requireWarehouse(
    storeId: string,
    id: string,
  ): Promise<Warehouse> {
    const warehouse = await this.warehouseRepository.findById(storeId, id);

    if (!warehouse) {
      throw new WarehouseError(
        WAREHOUSE_ERROR_CODES.NOT_FOUND,
        "Warehouse not found",
        404,
      );
    }

    return warehouse;
  }

  private mapRepositoryError(error: unknown): WarehouseError {
    if (
      error instanceof Error &&
      error.message.startsWith("Warehouse not found:")
    ) {
      return new WarehouseError(
        WAREHOUSE_ERROR_CODES.NOT_FOUND,
        "Warehouse not found",
        404,
      );
    }

    if (
      error instanceof Error &&
      error.message.startsWith("Warehouse code already exists:")
    ) {
      return new WarehouseError(
        WAREHOUSE_ERROR_CODES.CODE_ALREADY_EXISTS,
        "Warehouse code already exists for this store",
        409,
      );
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return new WarehouseError(
        WAREHOUSE_ERROR_CODES.CODE_ALREADY_EXISTS,
        "Warehouse code already exists for this store",
        409,
      );
    }

    if (error instanceof WarehouseError) {
      return error;
    }

    return new WarehouseError(
      WAREHOUSE_ERROR_CODES.TRANSACTION_FAILED,
      "Warehouse transaction failed",
      500,
    );
  }
}

export const warehouseService = new WarehouseService();
