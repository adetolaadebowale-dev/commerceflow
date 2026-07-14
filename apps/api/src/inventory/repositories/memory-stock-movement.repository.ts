import {
  buildCatalogueListResult,
  type StockMovement,
  type CatalogueListResult,
} from "@commerceflow/types";
import type { ListStockMovementsQuery } from "@commerceflow/validation";

import type { MemoryInventoryItemRepository } from "./memory-inventory-item.repository";
import type { StockMovementRepository } from "./stock-movement.repository";

export class MemoryStockMovementRepository implements StockMovementRepository {
  constructor(
    private readonly inventoryItemRepository: MemoryInventoryItemRepository,
  ) {}

  async list(
    query: ListStockMovementsQuery,
  ): Promise<CatalogueListResult<StockMovement>> {
    let items = [...this.inventoryItemRepository.getAllMovements()].filter(
      (movement) => movement.storeId === query.storeId,
    );

    if (query.inventoryItemId) {
      items = items.filter(
        (movement) => movement.inventoryItemId === query.inventoryItemId,
      );
    }

    if (query.productVariantId) {
      items = items.filter(
        (movement) => movement.productVariantId === query.productVariantId,
      );
    }

    items.sort(
      (left, right) =>
        right.createdAt.localeCompare(left.createdAt) ||
        left.id.localeCompare(right.id),
    );

    const total = items.length;
    const start = (query.page - 1) * query.limit;
    const paged = items.slice(start, start + query.limit);

    return buildCatalogueListResult({
      items: paged,
      total,
      page: query.page,
      limit: query.limit,
    });
  }
}
