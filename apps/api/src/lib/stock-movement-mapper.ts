import type { StockMovement as PrismaStockMovement } from "@prisma/client";
import type { StockMovement } from "@commerceflow/types";

export function toStockMovement(record: PrismaStockMovement): StockMovement {
  return {
    id: record.id,
    storeId: record.storeId,
    warehouseId: record.warehouseId,
    inventoryItemId: record.inventoryItemId,
    shipmentId: record.shipmentId ?? undefined,
    inventoryAllocationId: record.inventoryAllocationId ?? undefined,
    movementType: record.movementType,
    quantity: record.quantity,
    previousQuantityOnHand: record.previousQuantityOnHand,
    newQuantityOnHand: record.newQuantityOnHand,
    reference: record.reference ?? undefined,
    metadata:
      record.metadata && typeof record.metadata === "object"
        ? (record.metadata as Record<string, unknown>)
        : undefined,
    createdAt: record.createdAt.toISOString(),
  };
}

export function adjustmentMovementTypeFromReason(
  reason: string,
): "adjustment" | "fulfillment" {
  return reason === "sale_fulfilled" ? "fulfillment" : "adjustment";
}
