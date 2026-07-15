import {
  type CycleCount as PrismaCycleCount,
  type CycleCountItem as PrismaCycleCountItem,
  type InventoryAdjustment as PrismaInventoryAdjustment,
  type PrismaClient,
} from "@prisma/client";
import type {
  CycleCount,
  CycleCountApprovalResult,
  CycleCountItem,
  InventoryAdjustment,
  CatalogueListResult,
} from "@commerceflow/types";
import { buildCatalogueListResult } from "@commerceflow/types";
import type {
  ListCycleCountsQuery,
  UpdateCycleCountInput,
} from "@commerceflow/validation";

import { toStockMovement } from "@/lib/stock-movement-mapper";
import { generateAdjustmentNumber } from "../services/cycle-count-number";
import type {
  ApproveCycleCountRecord,
  CreateCycleCountRecord,
  CycleCountRepository,
} from "./cycle-count.repository";

type CycleCountWithItems = PrismaCycleCount & {
  items: PrismaCycleCountItem[];
};

function toCycleCountItem(record: PrismaCycleCountItem): CycleCountItem {
  return {
    id: record.id,
    cycleCountId: record.cycleCountId,
    inventoryItemId: record.inventoryItemId,
    expectedQuantity: record.expectedQuantity,
    countedQuantity: record.countedQuantity,
    variance: record.variance,
    adjustmentId: record.adjustmentId ?? undefined,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function toCycleCount(record: CycleCountWithItems): CycleCount {
  return {
    id: record.id,
    storeId: record.storeId,
    warehouseId: record.warehouseId,
    cycleCountNumber: record.cycleCountNumber,
    status: record.status,
    startedAt: record.startedAt?.toISOString(),
    completedAt: record.completedAt?.toISOString(),
    items: record.items.map(toCycleCountItem),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function toInventoryAdjustment(
  record: PrismaInventoryAdjustment,
): InventoryAdjustment {
  return {
    id: record.id,
    storeId: record.storeId,
    warehouseId: record.warehouseId,
    inventoryItemId: record.inventoryItemId,
    adjustmentNumber: record.adjustmentNumber,
    movementQuantity: record.movementQuantity,
    reason: record.reason,
    notes: record.notes ?? undefined,
    previousQuantityOnHand: record.previousQuantityOnHand,
    newQuantityOnHand: record.newQuantityOnHand,
    createdByUserId: record.createdByUserId,
    createdAt: record.createdAt.toISOString(),
  };
}

const itemsInclude = {
  orderBy: [{ createdAt: "asc" as const }, { id: "asc" as const }],
};

export class PrismaCycleCountRepository implements CycleCountRepository {
  constructor(private readonly db: PrismaClient) {}

  async findById(storeId: string, id: string): Promise<CycleCount | null> {
    const record = await this.db.cycleCount.findFirst({
      where: { id, storeId },
      include: { items: itemsInclude },
    });

    return record ? toCycleCount(record) : null;
  }

  async list(query: ListCycleCountsQuery): Promise<CatalogueListResult<CycleCount>> {
    const where = { storeId: query.storeId };
    const skip = (query.page - 1) * query.limit;

    const [records, total] = await Promise.all([
      this.db.cycleCount.findMany({
        where,
        include: { items: itemsInclude },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip,
        take: query.limit,
      }),
      this.db.cycleCount.count({ where }),
    ]);

    return buildCatalogueListResult({
      items: records.map(toCycleCount),
      total,
      page: query.page,
      limit: query.limit,
    });
  }

  async create(record: CreateCycleCountRecord): Promise<CycleCount> {
    const created = await this.db.cycleCount.create({
      data: {
        storeId: record.storeId,
        warehouseId: record.warehouseId,
        cycleCountNumber: record.cycleCountNumber,
        items: {
          create: record.items.map((item) => ({
            inventoryItemId: item.inventoryItemId,
            expectedQuantity: item.expectedQuantity,
          })),
        },
      },
      include: { items: itemsInclude },
    });

    return toCycleCount(created);
  }

  async startCycleCount(
    storeId: string,
    id: string,
    startedAt: Date,
  ): Promise<CycleCount> {
    return this.db.$transaction(async (tx) => {
      const existing = await tx.cycleCount.findFirst({
        where: { id, storeId },
        include: { items: itemsInclude },
      });

      if (!existing) {
        throw new Error(`CycleCount not found: ${id}`);
      }

      if (existing.status !== "draft") {
        throw new Error("INVALID_STATUS_TRANSITION");
      }

      const updated = await tx.cycleCount.update({
        where: { id },
        data: {
          status: "counting",
          startedAt,
        },
        include: { items: itemsInclude },
      });

      return toCycleCount(updated);
    });
  }

  async completeCycleCount(
    storeId: string,
    id: string,
    input: UpdateCycleCountInput,
    completedAt: Date,
  ): Promise<CycleCount> {
    return this.db.$transaction(async (tx) => {
      const existing = await tx.cycleCount.findFirst({
        where: { id, storeId },
        include: { items: itemsInclude },
      });

      if (!existing) {
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

        const variance = update.countedQuantity - item.expectedQuantity;

        await tx.cycleCountItem.update({
          where: { id: update.cycleCountItemId },
          data: {
            countedQuantity: update.countedQuantity,
            variance,
          },
        });
      }

      const updated = await tx.cycleCount.update({
        where: { id },
        data: {
          status: "completed",
          completedAt,
        },
        include: { items: itemsInclude },
      });

      return toCycleCount(updated);
    });
  }

  async approveCycleCount(
    record: ApproveCycleCountRecord,
    _approvedAt: Date,
  ): Promise<CycleCountApprovalResult> {
    return this.db.$transaction(async (tx) => {
      const existing = await tx.cycleCount.findFirst({
        where: { id: record.cycleCountId, storeId: record.storeId },
        include: { items: itemsInclude },
      });

      if (!existing) {
        throw new Error(`CycleCount not found: ${record.cycleCountId}`);
      }

      if (existing.status !== "completed") {
        throw new Error("INVALID_STATUS_TRANSITION");
      }

      const adjustments: CycleCountApprovalResult["adjustments"][number][] = [];
      const stockMovements: CycleCountApprovalResult["stockMovements"][number][] =
        [];

      for (const item of existing.items) {
        if (item.variance === 0) {
          continue;
        }

        const inventory = await tx.inventoryItem.findFirst({
          where: {
            id: item.inventoryItemId,
            storeId: record.storeId,
            deletedAt: null,
          },
        });

        if (!inventory) {
          throw new Error(`InventoryItem not found: ${item.inventoryItemId}`);
        }

        const newQuantityOnHand = inventory.quantityOnHand + item.variance;

        if (newQuantityOnHand < 0) {
          throw new Error("INSUFFICIENT_STOCK");
        }

        await tx.inventoryItem.update({
          where: { id: inventory.id },
          data: { quantityOnHand: newQuantityOnHand },
        });

        const adjustmentNumber = generateAdjustmentNumber();
        const reason = `Cycle count ${existing.cycleCountNumber} variance reconciliation`;

        const stockMovement = await tx.stockMovement.create({
          data: {
            storeId: record.storeId,
            warehouseId: inventory.warehouseId,
            inventoryItemId: inventory.id,
            movementType: "adjustment",
            quantity: item.variance,
            previousQuantityOnHand: inventory.quantityOnHand,
            newQuantityOnHand,
            reference: adjustmentNumber,
            metadata: {
              reason,
              cycleCountId: existing.id,
              cycleCountItemId: item.id,
              cycleCountNumber: existing.cycleCountNumber,
            },
          },
        });

        const adjustment = await tx.inventoryAdjustment.create({
          data: {
            storeId: record.storeId,
            warehouseId: inventory.warehouseId,
            inventoryItemId: inventory.id,
            adjustmentNumber,
            movementQuantity: item.variance,
            reason,
            notes: `Variance ${item.variance} (expected ${item.expectedQuantity}, counted ${item.countedQuantity})`,
            previousQuantityOnHand: inventory.quantityOnHand,
            newQuantityOnHand,
            createdByUserId: record.createdByUserId,
          },
        });

        await tx.cycleCountItem.update({
          where: { id: item.id },
          data: { adjustmentId: adjustment.id },
        });

        adjustments.push(toInventoryAdjustment(adjustment));
        stockMovements.push(toStockMovement(stockMovement));
      }

      const updated = await tx.cycleCount.update({
        where: { id: record.cycleCountId },
        data: { status: "approved" },
        include: { items: itemsInclude },
      });

      return {
        cycleCount: toCycleCount(updated),
        adjustments,
        stockMovements,
      };
    });
  }
}
