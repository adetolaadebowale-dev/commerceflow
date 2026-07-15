import type {
  CycleCount,
  CycleCountApprovalResult,
  InventoryAdjustment,
  StockMovement,
} from "@commerceflow/types";
import { buildCatalogueListResult } from "@commerceflow/types";
import type {
  ListCycleCountsQuery,
  UpdateCycleCountInput,
} from "@commerceflow/validation";

import type { MemoryInventoryItemRepository } from "../../inventory/repositories/memory-inventory-item.repository";
import { generateAdjustmentNumber } from "../services/cycle-count-number";
import type {
  ApproveCycleCountRecord,
  CreateCycleCountRecord,
  CycleCountRepository,
} from "./cycle-count.repository";

type MutableCycleCountItem = {
  id: string;
  cycleCountId: string;
  inventoryItemId: string;
  expectedQuantity: number;
  countedQuantity: number;
  variance: number;
  adjustmentId?: string;
  createdAt: string;
  updatedAt: string;
};

type MutableCycleCountRecord = {
  id: string;
  storeId: string;
  cycleCountNumber: string;
  status: CycleCount["status"];
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  items: MutableCycleCountItem[];
};

function toCycleCount(record: MutableCycleCountRecord): CycleCount {
  return {
    ...record,
    items: record.items.map((item) => ({ ...item })),
  };
}

export class MemoryCycleCountRepository implements CycleCountRepository {
  private readonly cycleCountsById = new Map<string, MutableCycleCountRecord>();
  private readonly adjustmentsById = new Map<string, InventoryAdjustment>();
  private transactionFailure: Error | null = null;

  constructor(
    private readonly inventoryItemRepository: MemoryInventoryItemRepository,
  ) {}

  setTransactionFailure(error: Error | null): void {
    this.transactionFailure = error;
    this.inventoryItemRepository.setTransactionFailure(error);
  }

  async findById(storeId: string, id: string): Promise<CycleCount | null> {
    const record = this.cycleCountsById.get(id);
    return record?.storeId === storeId ? toCycleCount(record) : null;
  }

  async list(query: ListCycleCountsQuery) {
    const items = [...this.cycleCountsById.values()]
      .filter((record) => record.storeId === query.storeId)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt));

    const start = (query.page - 1) * query.limit;

    return buildCatalogueListResult({
      items: items.slice(start, start + query.limit).map(toCycleCount),
      total: items.length,
      page: query.page,
      limit: query.limit,
    });
  }

  async create(record: CreateCycleCountRecord): Promise<CycleCount> {
    const now = new Date().toISOString();
    const cycleCountId = crypto.randomUUID();

    const cycleCount: MutableCycleCountRecord = {
      id: cycleCountId,
      storeId: record.storeId,
      cycleCountNumber: record.cycleCountNumber,
      status: "draft",
      items: record.items.map((item) => ({
        id: crypto.randomUUID(),
        cycleCountId,
        inventoryItemId: item.inventoryItemId,
        expectedQuantity: item.expectedQuantity,
        countedQuantity: 0,
        variance: 0,
        createdAt: now,
        updatedAt: now,
      })),
      createdAt: now,
      updatedAt: now,
    };

    this.cycleCountsById.set(cycleCountId, cycleCount);

    return toCycleCount(cycleCount);
  }

  async startCycleCount(
    storeId: string,
    id: string,
    startedAt: Date,
  ): Promise<CycleCount> {
    const existing = this.cycleCountsById.get(id);

    if (!existing || existing.storeId !== storeId) {
      throw new Error(`CycleCount not found: ${id}`);
    }

    if (existing.status !== "draft") {
      throw new Error("INVALID_STATUS_TRANSITION");
    }

    existing.status = "counting";
    existing.startedAt = startedAt.toISOString();
    existing.updatedAt = startedAt.toISOString();

    return toCycleCount(existing);
  }

  async completeCycleCount(
    storeId: string,
    id: string,
    input: UpdateCycleCountInput,
    completedAt: Date,
  ): Promise<CycleCount> {
    const existing = this.cycleCountsById.get(id);

    if (!existing || existing.storeId !== storeId) {
      throw new Error(`CycleCount not found: ${id}`);
    }

    if (existing.status !== "counting") {
      throw new Error("INVALID_STATUS_TRANSITION");
    }

    for (const update of input.items) {
      const item = existing.items.find(
        (entry) => entry.id === update.cycleCountItemId,
      );

      if (!item) {
        throw new Error(`CycleCountItem not found: ${update.cycleCountItemId}`);
      }

      item.countedQuantity = update.countedQuantity;
      item.variance = update.countedQuantity - item.expectedQuantity;
      item.updatedAt = completedAt.toISOString();
    }

    existing.status = "completed";
    existing.completedAt = completedAt.toISOString();
    existing.updatedAt = completedAt.toISOString();

    return toCycleCount(existing);
  }

  async approveCycleCount(
    record: ApproveCycleCountRecord,
    approvedAt: Date,
  ): Promise<CycleCountApprovalResult> {
    const existing = this.cycleCountsById.get(record.cycleCountId);

    if (!existing || existing.storeId !== record.storeId) {
      throw new Error(`CycleCount not found: ${record.cycleCountId}`);
    }

    if (existing.status !== "completed") {
      throw new Error("INVALID_STATUS_TRANSITION");
    }

    const adjustments: InventoryAdjustment[] = [];
    const stockMovements: StockMovement[] = [];

    for (const item of existing.items) {
      if (item.variance === 0) {
        continue;
      }

      const inventory = await this.inventoryItemRepository.findById(
        record.storeId,
        item.inventoryItemId,
      );

      if (!inventory) {
        throw new Error(`InventoryItem not found: ${item.inventoryItemId}`);
      }

      const { stockMovement } = await this.inventoryItemRepository.adjustStock({
        storeId: record.storeId,
        inventoryItemId: item.inventoryItemId,
        quantityChange: item.variance,
        reason: "manual_adjustment",
      });

      const now = approvedAt.toISOString();
      const adjustmentNumber = generateAdjustmentNumber();
      const reason = `Cycle count ${existing.cycleCountNumber} variance reconciliation`;

      const adjustment: InventoryAdjustment = {
        id: crypto.randomUUID(),
        storeId: record.storeId,
        inventoryItemId: item.inventoryItemId,
        adjustmentNumber,
        movementQuantity: item.variance,
        reason,
        notes: `Variance ${item.variance} (expected ${item.expectedQuantity}, counted ${item.countedQuantity})`,
        previousQuantityOnHand: stockMovement.previousQuantityOnHand,
        newQuantityOnHand: stockMovement.newQuantityOnHand,
        createdByUserId: record.createdByUserId,
        createdAt: now,
      };

      if (this.transactionFailure) {
        throw this.transactionFailure;
      }

      item.adjustmentId = adjustment.id;
      item.updatedAt = now;
      this.adjustmentsById.set(adjustment.id, adjustment);
      adjustments.push(adjustment);
      stockMovements.push({
        ...stockMovement,
        reference: adjustmentNumber,
        metadata: {
          reason,
          cycleCountId: existing.id,
          cycleCountItemId: item.id,
          cycleCountNumber: existing.cycleCountNumber,
        },
      });
    }

    existing.status = "approved";
    existing.updatedAt = approvedAt.toISOString();

    return {
      cycleCount: toCycleCount(existing),
      adjustments,
      stockMovements,
    };
  }
}
