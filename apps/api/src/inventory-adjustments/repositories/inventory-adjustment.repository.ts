import type {
  CatalogueListResult,
  InventoryAdjustment,
  InventoryAdjustmentResult,
} from "@commerceflow/types";
import type { ListInventoryAdjustmentsQuery } from "@commerceflow/validation";

export interface CreateInventoryAdjustmentRecord {
  readonly storeId: string;
  readonly inventoryItemId: string;
  readonly adjustmentNumber: string;
  readonly movementQuantity: number;
  readonly reason: string;
  readonly notes?: string;
  readonly createdByUserId: string;
}

export interface InventoryAdjustmentRepository {
  findById(storeId: string, id: string): Promise<InventoryAdjustment | null>;
  list(
    query: ListInventoryAdjustmentsQuery,
  ): Promise<CatalogueListResult<InventoryAdjustment>>;
  createAdjustment(
    record: CreateInventoryAdjustmentRecord,
  ): Promise<InventoryAdjustmentResult>;
}
