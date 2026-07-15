import type { CatalogueListResult, StockMovement } from "@commerceflow/types";
import type { ListStockMovementsQuery } from "@commerceflow/validation";

export interface StockMovementRepository {
  findById(storeId: string, id: string): Promise<StockMovement | null>;
  list(
    query: ListStockMovementsQuery,
  ): Promise<CatalogueListResult<StockMovement>>;
}
