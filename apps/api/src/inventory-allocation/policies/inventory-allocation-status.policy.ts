import type { InventoryAllocationStatus } from "@commerceflow/types";

/** Derives allocation status from allocated and picked quantities. */
export class InventoryAllocationStatusPolicy {
  static deriveStatus(
    quantityAllocated: number,
    quantityPicked: number,
  ): "allocated" | "partially_picked" | "picked" {
    if (quantityPicked <= 0) {
      return "allocated";
    }

    if (quantityPicked < quantityAllocated) {
      return "partially_picked";
    }

    return "picked";
  }

  static isMutable(status: InventoryAllocationStatus): boolean {
    return status === "allocated" || status === "partially_picked";
  }

  static holdsInventory(status: InventoryAllocationStatus): boolean {
    return status === "allocated" || status === "partially_picked";
  }

  static remainingHold(
    quantityAllocated: number,
    quantityPicked: number,
    status: InventoryAllocationStatus,
  ): number {
    if (!this.holdsInventory(status)) {
      return 0;
    }

    return Math.max(0, quantityAllocated - quantityPicked);
  }
}
