import type { InventoryAllocation } from "@commerceflow/types";

import type { CreateInventoryAllocationRecord } from "./inventory-allocation-create-record";
import type {
  ReportInventoryAllocationShortageRecord,
  UpdateInventoryAllocationPickedRecord,
} from "./inventory-allocation-create-record";

export interface InventoryAllocationRepository {
  findById(storeId: string, id: string): Promise<InventoryAllocation | null>;
  listByPickListItemId(
    storeId: string,
    pickListItemId: string,
  ): Promise<readonly InventoryAllocation[]>;
  listByInventoryItemId(
    storeId: string,
    inventoryItemId: string,
  ): Promise<readonly InventoryAllocation[]>;
  create(record: CreateInventoryAllocationRecord): Promise<InventoryAllocation>;
  updatePickedQuantity(
    storeId: string,
    id: string,
    update: UpdateInventoryAllocationPickedRecord,
  ): Promise<InventoryAllocation>;
  reportShortage(
    storeId: string,
    id: string,
    update: ReportInventoryAllocationShortageRecord,
  ): Promise<InventoryAllocation>;
  markFulfilled(storeId: string, id: string): Promise<InventoryAllocation>;
}
