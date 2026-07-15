import type {
  CatalogueListResult,
  InventoryAdjustment,
  InventoryAdjustmentResult,
} from "@commerceflow/types";
import type {
  CreateInventoryAdjustmentInput,
  InventoryAdjustmentIdQuery,
  ListInventoryAdjustmentsQuery,
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
  INVENTORY_ADJUSTMENT_ERROR_CODES,
  InventoryAdjustmentError,
} from "../errors";
import {
  getInventoryAdjustmentRepository,
  type InventoryAdjustmentRepository,
} from "../repositories";
import {
  generateAdjustmentNumber,
  isUniqueAdjustmentNumberViolation,
} from "./adjustment-number";

export interface InventoryAdjustmentServiceDependencies {
  readonly inventoryAdjustmentRepository?: InventoryAdjustmentRepository;
  readonly inventoryItemRepository?: InventoryItemRepository;
  readonly domainEventPublisher?: DomainEventPublisher;
}

export class InventoryAdjustmentService {
  private readonly inventoryAdjustmentRepository: InventoryAdjustmentRepository;
  private readonly inventoryItemRepository: InventoryItemRepository;
  private readonly domainEventPublisher: DomainEventPublisher;

  constructor(dependencies: InventoryAdjustmentServiceDependencies = {}) {
    this.inventoryAdjustmentRepository =
      dependencies.inventoryAdjustmentRepository ??
      getInventoryAdjustmentRepository();
    this.inventoryItemRepository =
      dependencies.inventoryItemRepository ?? getInventoryItemRepository();
    this.domainEventPublisher =
      dependencies.domainEventPublisher ?? getDomainEventPublisher();
  }

  async createAdjustment(
    input: CreateInventoryAdjustmentInput,
    createdByUserId: string,
  ): Promise<InventoryAdjustmentResult> {
    const inventoryItem = await this.inventoryItemRepository.findById(
      input.storeId,
      input.inventoryItemId,
    );

    if (!inventoryItem) {
      throw new InventoryAdjustmentError(
        INVENTORY_ADJUSTMENT_ERROR_CODES.INVENTORY_ITEM_NOT_FOUND,
        "Inventory item not found",
        404,
      );
    }

    const maxAttempts = 3;

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      try {
        const result = await this.inventoryAdjustmentRepository.createAdjustment(
          {
            storeId: input.storeId,
            inventoryItemId: input.inventoryItemId,
            adjustmentNumber: generateAdjustmentNumber(),
            movementQuantity: input.movementQuantity,
            reason: input.reason,
            notes: input.notes,
            createdByUserId,
          },
        );

        this.domainEventPublisher.publishInventoryAdjusted(result);
        this.domainEventPublisher.publishStockMovementCreated(result.stockMovement);

        return result;
      } catch (error) {
        if (
          isUniqueAdjustmentNumberViolation(error) &&
          attempt < maxAttempts - 1
        ) {
          continue;
        }

        if (
          error instanceof Error &&
          error.message === "INSUFFICIENT_STOCK"
        ) {
          throw new InventoryAdjustmentError(
            INVENTORY_ADJUSTMENT_ERROR_CODES.INSUFFICIENT_STOCK,
            "Insufficient stock for adjustment",
            409,
          );
        }

        if (
          error instanceof Error &&
          error.message.startsWith("InventoryItem not found")
        ) {
          throw new InventoryAdjustmentError(
            INVENTORY_ADJUSTMENT_ERROR_CODES.INVENTORY_ITEM_NOT_FOUND,
            "Inventory item not found",
            404,
          );
        }

        throw new InventoryAdjustmentError(
          INVENTORY_ADJUSTMENT_ERROR_CODES.TRANSACTION_FAILED,
          "Failed to create inventory adjustment",
          500,
        );
      }
    }

    throw new InventoryAdjustmentError(
      INVENTORY_ADJUSTMENT_ERROR_CODES.TRANSACTION_FAILED,
      "Failed to create inventory adjustment",
      500,
    );
  }

  async getAdjustment(
    query: InventoryAdjustmentIdQuery,
    id: string,
  ): Promise<InventoryAdjustment> {
    const adjustment = await this.inventoryAdjustmentRepository.findById(
      query.storeId,
      id,
    );

    if (!adjustment) {
      throw new InventoryAdjustmentError(
        INVENTORY_ADJUSTMENT_ERROR_CODES.ADJUSTMENT_NOT_FOUND,
        "Inventory adjustment not found",
        404,
      );
    }

    return adjustment;
  }

  async listAdjustments(
    query: ListInventoryAdjustmentsQuery,
  ): Promise<CatalogueListResult<InventoryAdjustment>> {
    return this.inventoryAdjustmentRepository.list(query);
  }
}

export const inventoryAdjustmentService = new InventoryAdjustmentService();
