import {
  Prisma,
  type PrismaClient,
  type StockMovement as PrismaStockMovement,
} from "@prisma/client";
import {
  buildCatalogueListResult,
  type StockMovement,
} from "@commerceflow/types";
import type { ListStockMovementsQuery } from "@commerceflow/validation";

import type { StockMovementRepository } from "./stock-movement.repository";

function toStockMovement(record: PrismaStockMovement): StockMovement {
  return {
    id: record.id,
    storeId: record.storeId,
    inventoryItemId: record.inventoryItemId,
    productVariantId: record.productVariantId,
    quantityChange: record.quantityChange,
    quantityAfter: record.quantityAfter,
    reason: record.reason,
    createdAt: record.createdAt.toISOString(),
  };
}

function buildListWhere(
  query: ListStockMovementsQuery,
): Prisma.StockMovementWhereInput {
  return {
    storeId: query.storeId,
    ...(query.inventoryItemId
      ? { inventoryItemId: query.inventoryItemId }
      : {}),
    ...(query.productVariantId
      ? { productVariantId: query.productVariantId }
      : {}),
  };
}

export class PrismaStockMovementRepository implements StockMovementRepository {
  constructor(private readonly db: PrismaClient) {}

  async list(query: ListStockMovementsQuery) {
    const where = buildListWhere(query);
    const skip = (query.page - 1) * query.limit;

    const [records, total] = await Promise.all([
      this.db.stockMovement.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: query.limit,
      }),
      this.db.stockMovement.count({ where }),
    ]);

    return buildCatalogueListResult({
      items: records.map(toStockMovement),
      total,
      page: query.page,
      limit: query.limit,
    });
  }
}
