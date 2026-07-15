import { Prisma, type PrismaClient } from "@prisma/client";
import { buildCatalogueListResult } from "@commerceflow/types";
import type { ListStockMovementsQuery } from "@commerceflow/validation";

import { toStockMovement } from "@/lib/stock-movement-mapper";
import type { StockMovementRepository } from "./stock-movement.repository";

function buildListWhere(
  query: ListStockMovementsQuery,
): Prisma.StockMovementWhereInput {
  return {
    storeId: query.storeId,
    ...(query.warehouseId ? { warehouseId: query.warehouseId } : {}),
    ...(query.inventoryItemId
      ? { inventoryItemId: query.inventoryItemId }
      : {}),
  };
}

export class PrismaStockMovementRepository implements StockMovementRepository {
  constructor(private readonly db: PrismaClient) {}

  async findById(storeId: string, id: string) {
    const record = await this.db.stockMovement.findFirst({
      where: { id, storeId },
    });

    return record ? toStockMovement(record) : null;
  }

  async list(query: ListStockMovementsQuery) {
    const where = buildListWhere(query);
    const skip = (query.page - 1) * query.limit;

    const [records, total] = await Promise.all([
      this.db.stockMovement.findMany({
        where,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
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
