import {
  type InventoryAdjustment as PrismaInventoryAdjustment,
  type PrismaClient,
} from "@prisma/client";
import type {
  InventoryAdjustment,
  InventoryAdjustmentResult,
  CatalogueListResult,
} from "@commerceflow/types";
import { buildCatalogueListResult } from "@commerceflow/types";
import type { ListInventoryAdjustmentsQuery } from "@commerceflow/validation";

import { toStockMovement } from "@/lib/stock-movement-mapper";
import type {
  CreateInventoryAdjustmentRecord,
  InventoryAdjustmentRepository,
} from "./inventory-adjustment.repository";

function toInventoryAdjustment(
  record: PrismaInventoryAdjustment,
): InventoryAdjustment {
  return {
    id: record.id,
    storeId: record.storeId,
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

export class PrismaInventoryAdjustmentRepository
  implements InventoryAdjustmentRepository
{
  constructor(private readonly db: PrismaClient) {}

  async findById(storeId: string, id: string): Promise<InventoryAdjustment | null> {
    const record = await this.db.inventoryAdjustment.findFirst({
      where: { id, storeId },
    });

    return record ? toInventoryAdjustment(record) : null;
  }

  async list(query: ListInventoryAdjustmentsQuery): Promise<
    CatalogueListResult<InventoryAdjustment>
  > {
    const where = {
      storeId: query.storeId,
      ...(query.inventoryItemId
        ? { inventoryItemId: query.inventoryItemId }
        : {}),
    };
    const skip = (query.page - 1) * query.limit;

    const [records, total] = await Promise.all([
      this.db.inventoryAdjustment.findMany({
        where,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip,
        take: query.limit,
      }),
      this.db.inventoryAdjustment.count({ where }),
    ]);

    return buildCatalogueListResult({
      items: records.map(toInventoryAdjustment),
      total,
      page: query.page,
      limit: query.limit,
    });
  }

  async createAdjustment(
    record: CreateInventoryAdjustmentRecord,
  ): Promise<InventoryAdjustmentResult> {
    return this.db.$transaction(async (tx) => {
      const existing = await tx.inventoryItem.findFirst({
        where: {
          id: record.inventoryItemId,
          storeId: record.storeId,
          deletedAt: null,
        },
      });

      if (!existing) {
        throw new Error(`InventoryItem not found: ${record.inventoryItemId}`);
      }

      const newQuantityOnHand = existing.quantityOnHand + record.movementQuantity;

      if (newQuantityOnHand < 0) {
        throw new Error("INSUFFICIENT_STOCK");
      }

      await tx.inventoryItem.update({
        where: { id: existing.id },
        data: { quantityOnHand: newQuantityOnHand },
      });

      const stockMovement = await tx.stockMovement.create({
        data: {
          storeId: record.storeId,
          inventoryItemId: existing.id,
          movementType: "adjustment",
          quantity: record.movementQuantity,
          previousQuantityOnHand: existing.quantityOnHand,
          newQuantityOnHand,
          reference: record.adjustmentNumber,
          metadata: {
            reason: record.reason,
            adjustmentNumber: record.adjustmentNumber,
          },
        },
      });

      const adjustment = await tx.inventoryAdjustment.create({
        data: {
          storeId: record.storeId,
          inventoryItemId: existing.id,
          adjustmentNumber: record.adjustmentNumber,
          movementQuantity: record.movementQuantity,
          reason: record.reason,
          notes: record.notes,
          previousQuantityOnHand: existing.quantityOnHand,
          newQuantityOnHand,
          createdByUserId: record.createdByUserId,
        },
      });

      return {
        adjustment: toInventoryAdjustment(adjustment),
        stockMovement: toStockMovement(stockMovement),
      };
    });
  }
}
