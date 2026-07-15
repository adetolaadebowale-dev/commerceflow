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

  async findById(storeId: string, id: string) {
    const movement = this.inventoryItemRepository
      .getAllMovements()
      .find((entry) => entry.id === id && entry.storeId === storeId);

    return movement ?? null;
  }

  async list(
    query: ListStockMovementsQuery,
  ): Promise<CatalogueListResult<StockMovement>> {
    let items = [...this.inventoryItemRepository.getAllMovements()].filter(
      (movement) => movement.storeId === query.storeId,
    );

    if (query.warehouseId) {
      items = items.filter(
        (movement) => movement.warehouseId === query.warehouseId,
      );
    }

    if (query.inventoryItemId) {
      items = items.filter(
        (movement) => movement.inventoryItemId === query.inventoryItemId,
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
