import type { PickListItem } from "./pick-list-item";
import type { PickListStatus } from "./pick-list-status";

/** Warehouse pick list for preparing a shipment for packing. */
export interface PickList {
  readonly id: string;
  readonly storeId: string;
  readonly shipmentId: string;
  readonly status: PickListStatus;
  readonly assignedToUserId?: string;
  readonly startedAt?: string;
  readonly completedAt?: string;
  readonly items: readonly PickListItem[];
  readonly createdAt: string;
  readonly updatedAt: string;
}
