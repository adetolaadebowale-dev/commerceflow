import type {
  CatalogueListResult,
  CycleCount,
  CycleCountApprovalResult,
} from "@commerceflow/types";
import type {
  ApproveCycleCountInput,
  CreateCycleCountInput,
  CycleCountIdQuery,
  ListCycleCountsQuery,
  UpdateCycleCountInput,
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
import { CYCLE_COUNT_ERROR_CODES, CycleCountError } from "../errors";
import { CycleCountStatusTransitionPolicy } from "../policies/cycle-count-status-transition.policy";
import {
  getCycleCountRepository,
  type CycleCountRepository,
} from "../repositories";
import {
  generateCycleCountNumber,
  isUniqueCycleCountNumberViolation,
} from "./cycle-count-number";

export interface CycleCountServiceDependencies {
  readonly cycleCountRepository?: CycleCountRepository;
  readonly inventoryItemRepository?: InventoryItemRepository;
  readonly warehouseRepository?: WarehouseRepository;
  readonly domainEventPublisher?: DomainEventPublisher;
}

export class CycleCountService {
  private readonly cycleCountRepository: CycleCountRepository;
  private readonly inventoryItemRepository: InventoryItemRepository;
  private readonly warehouseRepository: WarehouseRepository;
  private readonly domainEventPublisher: DomainEventPublisher;

  constructor(dependencies: CycleCountServiceDependencies = {}) {
    this.cycleCountRepository =
      dependencies.cycleCountRepository ?? getCycleCountRepository();
    this.inventoryItemRepository =
      dependencies.inventoryItemRepository ?? getInventoryItemRepository();
    this.warehouseRepository =
      dependencies.warehouseRepository ?? getWarehouseRepository();
    this.domainEventPublisher =
      dependencies.domainEventPublisher ?? getDomainEventPublisher();
  }

  async createCycleCount(input: CreateCycleCountInput): Promise<CycleCount> {
    await this.requireActiveWarehouse(input.storeId, input.warehouseId);

    const uniqueItemIds = [...new Set(input.inventoryItemIds)];
    const items: { inventoryItemId: string; expectedQuantity: number }[] = [];

    for (const inventoryItemId of uniqueItemIds) {
      const inventoryItem = await this.inventoryItemRepository.findById(
        input.storeId,
        inventoryItemId,
      );

      if (!inventoryItem) {
        throw new CycleCountError(
          CYCLE_COUNT_ERROR_CODES.INVENTORY_ITEM_NOT_FOUND,
          "Inventory item not found",
          404,
        );
      }

      if (inventoryItem.warehouseId !== input.warehouseId) {
        throw new CycleCountError(
          CYCLE_COUNT_ERROR_CODES.VALIDATION_ERROR,
          "Inventory item does not belong to the specified warehouse",
          400,
        );
      }

      items.push({
        inventoryItemId,
        expectedQuantity: inventoryItem.quantityOnHand,
      });
    }

    const maxAttempts = 3;

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      try {
        const cycleCount = await this.cycleCountRepository.create({
          storeId: input.storeId,
          warehouseId: input.warehouseId,
          cycleCountNumber: generateCycleCountNumber(),
          items,
        });

        this.domainEventPublisher.publishCycleCountCreated(cycleCount);

        return cycleCount;
      } catch (error) {
        if (
          isUniqueCycleCountNumberViolation(error) &&
          attempt < maxAttempts - 1
        ) {
          continue;
        }

        throw new CycleCountError(
          CYCLE_COUNT_ERROR_CODES.TRANSACTION_FAILED,
          "Failed to create cycle count",
          500,
        );
      }
    }

    throw new CycleCountError(
      CYCLE_COUNT_ERROR_CODES.TRANSACTION_FAILED,
      "Failed to create cycle count",
      500,
    );
  }

  async getCycleCount(
    query: CycleCountIdQuery,
    id: string,
  ): Promise<CycleCount> {
    const cycleCount = await this.cycleCountRepository.findById(
      query.storeId,
      id,
    );

    if (!cycleCount) {
      throw new CycleCountError(
        CYCLE_COUNT_ERROR_CODES.CYCLE_COUNT_NOT_FOUND,
        "Cycle count not found",
        404,
      );
    }

    return cycleCount;
  }

  async listCycleCounts(
    query: ListCycleCountsQuery,
  ): Promise<CatalogueListResult<CycleCount>> {
    return this.cycleCountRepository.list(query);
  }

  async startCycleCount(
    id: string,
    input: ApproveCycleCountInput,
  ): Promise<CycleCount> {
    const existing = await this.cycleCountRepository.findById(
      input.storeId,
      id,
    );

    if (!existing) {
      throw new CycleCountError(
        CYCLE_COUNT_ERROR_CODES.CYCLE_COUNT_NOT_FOUND,
        "Cycle count not found",
        404,
      );
    }

    if (CycleCountStatusTransitionPolicy.isImmutable(existing.status)) {
      throw new CycleCountError(
        CYCLE_COUNT_ERROR_CODES.CYCLE_COUNT_IMMUTABLE,
        "Cycle count is immutable",
        409,
      );
    }

    if (
      !CycleCountStatusTransitionPolicy.canTransition(existing.status, "counting")
    ) {
      throw new CycleCountError(
        CYCLE_COUNT_ERROR_CODES.INVALID_STATUS_TRANSITION,
        "Invalid cycle count status transition",
        409,
      );
    }

    try {
      const cycleCount = await this.cycleCountRepository.startCycleCount(
        input.storeId,
        id,
        new Date(),
      );

      this.domainEventPublisher.publishCycleCountStarted(cycleCount);

      return cycleCount;
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === "INVALID_STATUS_TRANSITION"
      ) {
        throw new CycleCountError(
          CYCLE_COUNT_ERROR_CODES.INVALID_STATUS_TRANSITION,
          "Invalid cycle count status transition",
          409,
        );
      }

      throw new CycleCountError(
        CYCLE_COUNT_ERROR_CODES.TRANSACTION_FAILED,
        "Failed to start cycle count",
        500,
      );
    }
  }

  async completeCycleCount(
    id: string,
    input: UpdateCycleCountInput,
  ): Promise<CycleCount> {
    const existing = await this.cycleCountRepository.findById(
      input.storeId,
      id,
    );

    if (!existing) {
      throw new CycleCountError(
        CYCLE_COUNT_ERROR_CODES.CYCLE_COUNT_NOT_FOUND,
        "Cycle count not found",
        404,
      );
    }

    if (CycleCountStatusTransitionPolicy.isImmutable(existing.status)) {
      throw new CycleCountError(
        CYCLE_COUNT_ERROR_CODES.CYCLE_COUNT_IMMUTABLE,
        "Cycle count is immutable",
        409,
      );
    }

    if (
      !CycleCountStatusTransitionPolicy.canTransition(
        existing.status,
        "completed",
      )
    ) {
      throw new CycleCountError(
        CYCLE_COUNT_ERROR_CODES.INVALID_STATUS_TRANSITION,
        "Invalid cycle count status transition",
        409,
      );
    }

    for (const update of input.items) {
      const item = existing.items.find(
        (entry) => entry.id === update.cycleCountItemId,
      );

      if (!item) {
        throw new CycleCountError(
          CYCLE_COUNT_ERROR_CODES.CYCLE_COUNT_ITEM_NOT_FOUND,
          "Cycle count item not found",
          404,
        );
      }
    }

    try {
      const cycleCount = await this.cycleCountRepository.completeCycleCount(
        input.storeId,
        id,
        input,
        new Date(),
      );

      this.domainEventPublisher.publishCycleCountCompleted(cycleCount);

      return cycleCount;
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === "INVALID_STATUS_TRANSITION"
      ) {
        throw new CycleCountError(
          CYCLE_COUNT_ERROR_CODES.INVALID_STATUS_TRANSITION,
          "Invalid cycle count status transition",
          409,
        );
      }

      if (
        error instanceof Error &&
        error.message.startsWith("CycleCountItem not found")
      ) {
        throw new CycleCountError(
          CYCLE_COUNT_ERROR_CODES.CYCLE_COUNT_ITEM_NOT_FOUND,
          "Cycle count item not found",
          404,
        );
      }

      throw new CycleCountError(
        CYCLE_COUNT_ERROR_CODES.TRANSACTION_FAILED,
        "Failed to complete cycle count",
        500,
      );
    }
  }

  async approveCycleCount(
    id: string,
    input: ApproveCycleCountInput,
    createdByUserId: string,
  ): Promise<CycleCountApprovalResult> {
    const existing = await this.cycleCountRepository.findById(
      input.storeId,
      id,
    );

    if (!existing) {
      throw new CycleCountError(
        CYCLE_COUNT_ERROR_CODES.CYCLE_COUNT_NOT_FOUND,
        "Cycle count not found",
        404,
      );
    }

    if (existing.status === "approved") {
      throw new CycleCountError(
        CYCLE_COUNT_ERROR_CODES.CYCLE_COUNT_IMMUTABLE,
        "Cycle count is immutable",
        409,
      );
    }

    if (
      !CycleCountStatusTransitionPolicy.canTransition(existing.status, "approved")
    ) {
      throw new CycleCountError(
        CYCLE_COUNT_ERROR_CODES.INVALID_STATUS_TRANSITION,
        "Invalid cycle count status transition",
        409,
      );
    }

    try {
      const result = await this.cycleCountRepository.approveCycleCount(
        {
          storeId: input.storeId,
          cycleCountId: id,
          createdByUserId,
        },
        new Date(),
      );

      this.domainEventPublisher.publishCycleCountApproved(result);

      for (const stockMovement of result.stockMovements) {
        this.domainEventPublisher.publishStockMovementCreated(stockMovement);
      }

      result.adjustments.forEach((adjustment, index) => {
        const stockMovement = result.stockMovements[index];

        if (stockMovement) {
          this.domainEventPublisher.publishInventoryAdjusted({
            adjustment,
            stockMovement,
          });
        }
      });

      return result;
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === "INVALID_STATUS_TRANSITION"
      ) {
        throw new CycleCountError(
          CYCLE_COUNT_ERROR_CODES.INVALID_STATUS_TRANSITION,
          "Invalid cycle count status transition",
          409,
        );
      }

      if (
        error instanceof Error &&
        error.message === "INSUFFICIENT_STOCK"
      ) {
        throw new CycleCountError(
          CYCLE_COUNT_ERROR_CODES.INSUFFICIENT_STOCK,
          "Insufficient stock for cycle count approval",
          409,
        );
      }

      if (
        error instanceof Error &&
        error.message.startsWith("InventoryItem not found")
      ) {
        throw new CycleCountError(
          CYCLE_COUNT_ERROR_CODES.INVENTORY_ITEM_NOT_FOUND,
          "Inventory item not found",
          404,
        );
      }

      throw new CycleCountError(
        CYCLE_COUNT_ERROR_CODES.TRANSACTION_FAILED,
        "Failed to approve cycle count",
        500,
      );
    }
  }

  private async requireActiveWarehouse(
    storeId: string,
    warehouseId: string,
  ): Promise<void> {
    const warehouse = await this.warehouseRepository.findById(
      storeId,
      warehouseId,
    );

    if (!warehouse) {
      throw new CycleCountError(
        CYCLE_COUNT_ERROR_CODES.WAREHOUSE_NOT_FOUND,
        "Warehouse not found",
        404,
      );
    }

    if (warehouse.status !== "active") {
      throw new CycleCountError(
        CYCLE_COUNT_ERROR_CODES.VALIDATION_ERROR,
        "Warehouse must be active",
        400,
      );
    }
  }
}

export const cycleCountService = new CycleCountService();
