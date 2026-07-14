import type { CatalogueListResult, StockMovement } from "@commerceflow/types";
import type { ListStockMovementsQuery } from "@commerceflow/validation";

export interface StockMovementRepository {
  list(
    query: ListStockMovementsQuery,
  ): Promise<CatalogueListResult<StockMovement>>;
}
