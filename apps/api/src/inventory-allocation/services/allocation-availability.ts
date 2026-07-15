import type { InventoryAllocation } from "@commerceflow/types";

import { calculateAvailableQuantity } from "@/reservations/services/reservation-stock";
import { InventoryAllocationStatusPolicy } from "../policies/inventory-allocation-status.policy";

export function sumActiveAllocationHold(
  allocations: readonly InventoryAllocation[],
  excludeAllocationId?: string,
): number {
  return allocations.reduce((total, allocation) => {
    if (excludeAllocationId && allocation.id === excludeAllocationId) {
      return total;
    }

    return (
      total +
      InventoryAllocationStatusPolicy.remainingHold(
        allocation.quantityAllocated,
        allocation.quantityPicked,
        allocation.status,
      )
    );
  }, 0);
}

export function calculateAllocatableQuantity(
  quantityOnHand: number,
  activeReservedQuantity: number,
  activeAllocationHold: number,
): number {
  return calculateAvailableQuantity(
    quantityOnHand,
    activeReservedQuantity + activeAllocationHold,
  );
}
