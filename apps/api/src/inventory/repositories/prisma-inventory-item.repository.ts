import { Prisma, type PrismaClient, type InventoryItem as PrismaInventoryItem } from "@prisma/client";
import { buildCatalogueListResult, type InventoryItem } from "@commerceflow/types";
import type {
  CreateInventoryItemInput,
  CreateStockMovementInput,
  ListInventoryItemsQuery,
} from "@commerceflow/validation";

import {
  adjustmentMovementTypeFromReason,
  toStockMovement,
} from "@/lib/stock-movement-mapper";
import type { InventoryAdjustmentResult } from "./inventory-adjustment-result";
import type { InventoryItemRepository } from "./inventory-item.repository";

function toInventoryItem(record: PrismaInventoryItem): InventoryItem {
  return {
    id: record.id,
    storeId: record.storeId,
    productVariantId: record.productVariantId,
    quantityOnHand: record.quantityOnHand,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function buildListWhere(
  query: ListInventoryItemsQuery,
): Prisma.InventoryItemWhereInput {
  return {
    storeId: query.storeId,
    deletedAt: null,
    ...(query.productVariantId
      ? { productVariantId: query.productVariantId }
      : {}),
  };
}

export class PrismaInventoryItemRepository implements InventoryItemRepository {
  constructor(private readonly db: PrismaClient) {}

  async findById(storeId: string, id: string): Promise<InventoryItem | null> {
    const record = await this.db.inventoryItem.findFirst({
      where: { id, storeId, deletedAt: null },
    });

    return record ? toInventoryItem(record) : null;
  }

  async findByProductVariantId(
    storeId: string,
    productVariantId: string,
  ): Promise<InventoryItem | null> {
    const record = await this.db.inventoryItem.findFirst({
      where: { storeId, productVariantId, deletedAt: null },
    });

    return record ? toInventoryItem(record) : null;
  }

  async list(query: ListInventoryItemsQuery) {
    const where = buildListWhere(query);
    const skip = (query.page - 1) * query.limit;

    const [records, total] = await Promise.all([
      this.db.inventoryItem.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: query.limit,
      }),
      this.db.inventoryItem.count({ where }),
    ]);

    return buildCatalogueListResult({
      items: records.map(toInventoryItem),
      total,
      page: query.page,
      limit: query.limit,
    });
  }

  async createWithInitialMovement(
    input: CreateInventoryItemInput,
  ): Promise<InventoryAdjustmentResult> {
    return this.db.$transaction(async (tx) => {
      const inventoryItem = await tx.inventoryItem.create({
        data: {
          storeId: input.storeId,
          productVariantId: input.productVariantId,
          quantityOnHand: input.initialQuantity,
        },
      });

      const stockMovement = await tx.stockMovement.create({
        data: {
          storeId: input.storeId,
          inventoryItemId: inventoryItem.id,
          movementType: "adjustment",
          quantity: input.initialQuantity,
          previousQuantityOnHand: 0,
          newQuantityOnHand: input.initialQuantity,
          reference: "initial",
        },
      });

      return {
        inventoryItem: toInventoryItem(inventoryItem),
        stockMovement: toStockMovement(stockMovement),
      };
    });
  }

  async adjustStock(
    input: CreateStockMovementInput,
  ): Promise<InventoryAdjustmentResult> {
    return this.db.$transaction(async (tx) => {
      const existing = await tx.inventoryItem.findFirst({
        where: {
          id: input.inventoryItemId,
          storeId: input.storeId,
          deletedAt: null,
        },
      });

      if (!existing) {
        throw new Error(`InventoryItem not found: ${input.inventoryItemId}`);
      }

      const newQuantityOnHand = existing.quantityOnHand + input.quantityChange;

      if (newQuantityOnHand < 0) {
        throw new Error("INSUFFICIENT_STOCK");
      }

      const inventoryItem = await tx.inventoryItem.update({
        where: { id: existing.id },
        data: { quantityOnHand: newQuantityOnHand },
      });

      const stockMovement = await tx.stockMovement.create({
        data: {
          storeId: input.storeId,
          inventoryItemId: existing.id,
          movementType: adjustmentMovementTypeFromReason(input.reason),
          quantity: input.quantityChange,
          previousQuantityOnHand: existing.quantityOnHand,
          newQuantityOnHand,
          reference: input.reason,
        },
      });

      return {
        inventoryItem: toInventoryItem(inventoryItem),
        stockMovement: toStockMovement(stockMovement),
      };
    });
  }

  async productVariantExists(
    storeId: string,
    productVariantId: string,
  ): Promise<boolean> {
    const variant = await this.db.productVariant.findFirst({
      where: { id: productVariantId, storeId, deletedAt: null },
      select: { id: true },
    });

    return variant !== null;
  }
}
