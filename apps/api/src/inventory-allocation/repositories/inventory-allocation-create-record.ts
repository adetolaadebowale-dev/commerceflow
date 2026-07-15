export interface CreateInventoryAllocationRecord {
  readonly storeId: string;
  readonly warehouseId: string;
  readonly pickListItemId: string;
  readonly inventoryItemId: string;
  readonly quantityAllocated: number;
}

export interface UpdateInventoryAllocationPickedRecord {
  readonly quantityPicked: number;
  readonly status: "allocated" | "partially_picked" | "picked";
}

export interface ReportInventoryAllocationShortageRecord {
  readonly shortageReason: string;
}
