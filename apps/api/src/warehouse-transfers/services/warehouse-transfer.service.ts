import type {
  CatalogueListResult,
  WarehouseTransfer,
  WarehouseTransferReceiveResult,
  WarehouseTransferShipResult,
} from "@commerceflow/types";
import type {
  CreateWarehouseTransferInput,
  ListWarehouseTransfersQuery,
  WarehouseTransferIdQuery,
  WarehouseTransferLifecycleInput,
} from "@commerceflow/validation";

import {
  getDomainEventPublisher,
  type DomainEventPublisher,
} from "@/domain-events";
import {
  getInventoryItemRepository,
  type InventoryItemRepository,
} from "@/inventory/repositories";
import {
  getWarehouseRepository,
  type WarehouseRepository,
} from "@/warehouses/repositories";
import { WAREHOUSE_TRANSFER_ERROR_CODES, WarehouseTransferError } from "../errors";
import { WarehouseTransferStatusTransitionPolicy } from "../policies/warehouse-transfer-status-transition.policy";
import {
  getWarehouseTransferRepository,
  type WarehouseTransferRepository,
} from "../repositories";
import {
  generateWarehouseTransferNumber,
  isUniqueWarehouseTransferNumberViolation,
} from "./warehouse-transfer-number";

export interface WarehouseTransferServiceDependencies {
  readonly warehouseTransferRepository?: WarehouseTransferRepository;
  readonly inventoryItemRepository?: InventoryItemRepository;
  readonly warehouseRepository?: WarehouseRepository;
  readonly domainEventPublisher?: DomainEventPublisher;
}

export class WarehouseTransferService {
  private readonly warehouseTransferRepository: WarehouseTransferRepository;
  private readonly inventoryItemRepository: InventoryItemRepository;
  private readonly warehouseRepository: WarehouseRepository;
  private readonly domainEventPublisher: DomainEventPublisher;

  constructor(dependencies: WarehouseTransferServiceDependencies = {}) {
    this.warehouseTransferRepository =
      dependencies.warehouseTransferRepository ??
      getWarehouseTransferRepository();
    this.inventoryItemRepository =
      dependencies.inventoryItemRepository ?? getInventoryItemRepository();
    this.warehouseRepository =
      dependencies.warehouseRepository ?? getWarehouseRepository();
    this.domainEventPublisher =
      dependencies.domainEventPublisher ?? getDomainEventPublisher();
  }

  async createWarehouseTransfer(
    input: CreateWarehouseTransferInput,
  ): Promise<WarehouseTransfer> {
    if (input.sourceWarehouseId === input.destinationWarehouseId) {
      throw new WarehouseTransferError(
        WAREHOUSE_TRANSFER_ERROR_CODES.SAME_WAREHOUSE,
        "Source and destination warehouses must differ",
        400,
      );
    }

    await this.requireActiveWarehouse(input.storeId, input.sourceWarehouseId);
    await this.requireActiveWarehouse(
      input.storeId,
      input.destinationWarehouseId,
    );

    const uniqueItemIds = new Set<string>();
    const items: { inventoryItemId: string; quantity: number }[] = [];

    for (const item of input.items) {
      if (uniqueItemIds.has(item.inventoryItemId)) {
        throw new WarehouseTransferError(
          WAREHOUSE_TRANSFER_ERROR_CODES.VALIDATION_ERROR,
          "Duplicate inventory items are not allowed",
          400,
        );
      }

      uniqueItemIds.add(item.inventoryItemId);

      const inventoryItem = await this.inventoryItemRepository.findById(
        input.storeId,
        item.inventoryItemId,
      );

      if (!inventoryItem) {
        throw new WarehouseTransferError(
          WAREHOUSE_TRANSFER_ERROR_CODES.INVENTORY_ITEM_NOT_FOUND,
          "Inventory item not found",
          404,
        );
      }

      if (inventoryItem.warehouseId !== input.sourceWarehouseId) {
        throw new WarehouseTransferError(
          WAREHOUSE_TRANSFER_ERROR_CODES.VALIDATION_ERROR,
          "Inventory item does not belong to the source warehouse",
          400,
        );
      }

      items.push(item);
    }

    const maxAttempts = 3;

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      try {
        const warehouseTransfer = await this.warehouseTransferRepository.create({
          storeId: input.storeId,
          transferNumber: generateWarehouseTransferNumber(),
          sourceWarehouseId: input.sourceWarehouseId,
          destinationWarehouseId: input.destinationWarehouseId,
          notes: input.notes,
          items,
        });

        this.domainEventPublisher.publishWarehouseTransferCreated(warehouseTransfer);

        return warehouseTransfer;
      } catch (error) {
        if (
          isUniqueWarehouseTransferNumberViolation(error) &&
          attempt < maxAttempts - 1
        ) {
          continue;
        }

        throw new WarehouseTransferError(
          WAREHOUSE_TRANSFER_ERROR_CODES.TRANSACTION_FAILED,
          "Failed to create warehouse transfer",
          500,
        );
      }
    }

    throw new WarehouseTransferError(
      WAREHOUSE_TRANSFER_ERROR_CODES.TRANSACTION_FAILED,
      "Failed to create warehouse transfer",
      500,
    );
  }

  async getWarehouseTransfer(
    query: WarehouseTransferIdQuery,
    id: string,
  ): Promise<WarehouseTransfer> {
    const warehouseTransfer = await this.warehouseTransferRepository.findById(
      query.storeId,
      id,
    );

    if (!warehouseTransfer) {
      throw new WarehouseTransferError(
        WAREHOUSE_TRANSFER_ERROR_CODES.WAREHOUSE_TRANSFER_NOT_FOUND,
        "Warehouse transfer not found",
        404,
      );
    }

    return warehouseTransfer;
  }

  async listWarehouseTransfers(
    query: ListWarehouseTransfersQuery,
  ): Promise<CatalogueListResult<WarehouseTransfer>> {
    return this.warehouseTransferRepository.list(query);
  }

  async approveWarehouseTransfer(
    id: string,
    input: WarehouseTransferLifecycleInput,
  ): Promise<WarehouseTransfer> {
    const existing = await this.requireMutableTransfer(input.storeId, id);

    if (
      !WarehouseTransferStatusTransitionPolicy.canTransition(
        existing.status,
        "approved",
      )
    ) {
      throw new WarehouseTransferError(
        WAREHOUSE_TRANSFER_ERROR_CODES.INVALID_STATUS_TRANSITION,
        "Invalid warehouse transfer status transition",
        409,
      );
    }

    try {
      const warehouseTransfer =
        await this.warehouseTransferRepository.approveWarehouseTransfer(
          input.storeId,
          id,
          new Date(),
        );

      this.domainEventPublisher.publishWarehouseTransferApproved(warehouseTransfer);

      return warehouseTransfer;
    } catch (error) {
      return this.handleRepositoryError(error, "Failed to approve warehouse transfer");
    }
  }

  async shipWarehouseTransfer(
    id: string,
    input: WarehouseTransferLifecycleInput,
  ): Promise<WarehouseTransferShipResult> {
    const existing = await this.requireMutableTransfer(input.storeId, id);

    if (
      !WarehouseTransferStatusTransitionPolicy.canTransition(
        existing.status,
        "in_transit",
      )
    ) {
      throw new WarehouseTransferError(
        WAREHOUSE_TRANSFER_ERROR_CODES.INVALID_STATUS_TRANSITION,
        "Invalid warehouse transfer status transition",
        409,
      );
    }

    try {
      const result = await this.warehouseTransferRepository.shipWarehouseTransfer(
        input.storeId,
        id,
        new Date(),
      );

      this.domainEventPublisher.publishWarehouseTransferShipped(result);

      return result;
    } catch (error) {
      return this.handleRepositoryError(error, "Failed to ship warehouse transfer");
    }
  }

  async receiveWarehouseTransfer(
    id: string,
    input: WarehouseTransferLifecycleInput,
  ): Promise<WarehouseTransferReceiveResult> {
    const existing = await this.requireMutableTransfer(input.storeId, id);

    if (
      !WarehouseTransferStatusTransitionPolicy.canTransition(
        existing.status,
        "received",
      )
    ) {
      throw new WarehouseTransferError(
        WAREHOUSE_TRANSFER_ERROR_CODES.INVALID_STATUS_TRANSITION,
        "Invalid warehouse transfer status transition",
        409,
      );
    }

    try {
      const result =
        await this.warehouseTransferRepository.receiveWarehouseTransfer(
          input.storeId,
          id,
          new Date(),
        );

      this.domainEventPublisher.publishWarehouseTransferReceived(result);

      return result;
    } catch (error) {
      return this.handleRepositoryError(
        error,
        "Failed to receive warehouse transfer",
      );
    }
  }

  async cancelWarehouseTransfer(
    id: string,
    input: WarehouseTransferLifecycleInput,
  ): Promise<WarehouseTransfer> {
    const existing = await this.warehouseTransferRepository.findById(
      input.storeId,
      id,
    );

    if (!existing) {
      throw new WarehouseTransferError(
        WAREHOUSE_TRANSFER_ERROR_CODES.WAREHOUSE_TRANSFER_NOT_FOUND,
        "Warehouse transfer not found",
        404,
      );
    }

    if (WarehouseTransferStatusTransitionPolicy.isTerminal(existing.status)) {
      throw new WarehouseTransferError(
        WAREHOUSE_TRANSFER_ERROR_CODES.WAREHOUSE_TRANSFER_IMMUTABLE,
        "Warehouse transfer is immutable",
        409,
      );
    }

    if (
      !WarehouseTransferStatusTransitionPolicy.canTransition(
        existing.status,
        "cancelled",
      )
    ) {
      throw new WarehouseTransferError(
        WAREHOUSE_TRANSFER_ERROR_CODES.INVALID_STATUS_TRANSITION,
        "Invalid warehouse transfer status transition",
        409,
      );
    }

    const previousStatus = existing.status;

    try {
      const warehouseTransfer =
        await this.warehouseTransferRepository.cancelWarehouseTransfer(
          input.storeId,
          id,
        );

      this.domainEventPublisher.publishWarehouseTransferCancelled(
        warehouseTransfer,
        previousStatus,
      );

      return warehouseTransfer;
    } catch (error) {
      return this.handleRepositoryError(
        error,
        "Failed to cancel warehouse transfer",
      );
    }
  }

  private async requireMutableTransfer(
    storeId: string,
    id: string,
  ): Promise<WarehouseTransfer> {
    const existing = await this.warehouseTransferRepository.findById(
      storeId,
      id,
    );

    if (!existing) {
      throw new WarehouseTransferError(
        WAREHOUSE_TRANSFER_ERROR_CODES.WAREHOUSE_TRANSFER_NOT_FOUND,
        "Warehouse transfer not found",
        404,
      );
    }

    if (WarehouseTransferStatusTransitionPolicy.isImmutable(existing.status)) {
      throw new WarehouseTransferError(
        WAREHOUSE_TRANSFER_ERROR_CODES.WAREHOUSE_TRANSFER_IMMUTABLE,
        "Warehouse transfer is immutable",
        409,
      );
    }

    return existing;
  }

  private async requireActiveWarehouse(
    storeId: string,
    warehouseId: string,
  ): Promise<void> {
    const warehouse = await this.warehouseRepository.findById(storeId, warehouseId);

    if (!warehouse) {
      throw new WarehouseTransferError(
        WAREHOUSE_TRANSFER_ERROR_CODES.WAREHOUSE_NOT_FOUND,
        "Warehouse not found",
        404,
      );
    }

    if (warehouse.status !== "active") {
      throw new WarehouseTransferError(
        WAREHOUSE_TRANSFER_ERROR_CODES.VALIDATION_ERROR,
        "Warehouse must be active",
        400,
      );
    }
  }

  private handleRepositoryError(error: unknown, message: string): never {
    if (error instanceof Error) {
      if (error.message === "INVALID_STATUS_TRANSITION") {
        throw new WarehouseTransferError(
          WAREHOUSE_TRANSFER_ERROR_CODES.INVALID_STATUS_TRANSITION,
          "Invalid warehouse transfer status transition",
          409,
        );
      }

      if (error.message === "INSUFFICIENT_STOCK") {
        throw new WarehouseTransferError(
          WAREHOUSE_TRANSFER_ERROR_CODES.INSUFFICIENT_STOCK,
          "Insufficient inventory at source warehouse",
          409,
        );
      }
    }

    throw new WarehouseTransferError(
      WAREHOUSE_TRANSFER_ERROR_CODES.TRANSACTION_FAILED,
      message,
      500,
    );
  }
}

export const warehouseTransferService = new WarehouseTransferService();
