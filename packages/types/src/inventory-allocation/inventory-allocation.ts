import type { InventoryAllocationStatus } from "./inventory-allocation-status";

/** Inventory allocated to a pick list line item during warehouse picking. */
export interface InventoryAllocation {
  readonly id: string;
  readonly storeId: string;
  readonly pickListItemId: string;
  readonly inventoryItemId: string;
  readonly quantityAllocated: number;
  readonly quantityPicked: number;
  readonly status: InventoryAllocationStatus;
  readonly shortageReason?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}
