import type { InventoryItem, StockMovement } from "@commerceflow/types";

import { calculateAvailableQuantity } from "@/reservations/services/reservation-stock";
import type {
  InventoryItemFact,
  InventoryMovementFact,
} from "../repositories/inventory-report.repository";

export function mapItemToFact(input: {
  readonly item: InventoryItem;
  readonly quantityReserved: number;
  readonly quantityAllocated: number;
  readonly quantityIncoming: number;
  readonly quantityOutgoing: number;
  readonly unitCost: string;
  readonly currency: string;
  readonly rule?: {
    readonly reorderPoint: number;
    readonly reorderQuantity: number;
    readonly supplierId: string;
  };
}): InventoryItemFact {
  const quantityAvailable = calculateAvailableQuantity(
    input.item.quantityOnHand,
    input.quantityReserved + input.quantityAllocated,
  );

  return {
    inventoryItemId: input.item.id,
    storeId: input.item.storeId,
    warehouseId: input.item.warehouseId,
    productVariantId: input.item.productVariantId,
    quantityOnHand: input.item.quantityOnHand,
    quantityReserved: input.quantityReserved,
    quantityAllocated: input.quantityAllocated,
    quantityAvailable,
    quantityIncoming: input.quantityIncoming,
    quantityOutgoing: input.quantityOutgoing,
    unitCost: input.unitCost,
    currency: input.currency,
    reorderPoint: input.rule?.reorderPoint,
    reorderQuantity: input.rule?.reorderQuantity,
    supplierId: input.rule?.supplierId,
    reportTimestamp: input.item.updatedAt,
  };
}

export function mapMovementToFact(
  movement: StockMovement,
  productVariantId: string,
): InventoryMovementFact {
  return {
    movementId: movement.id,
    storeId: movement.storeId,
    inventoryItemId: movement.inventoryItemId,
    warehouseId: movement.warehouseId,
    productVariantId,
    movementType: movement.movementType,
    quantity: movement.quantity,
    previousQuantityOnHand: movement.previousQuantityOnHand,
    newQuantityOnHand: movement.newQuantityOnHand,
    reference: movement.reference,
    reportTimestamp: movement.createdAt,
  };
}
