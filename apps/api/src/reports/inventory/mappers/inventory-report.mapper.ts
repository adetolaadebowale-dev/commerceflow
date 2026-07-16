import type {
  InventoryMovementReportRow,
  InventoryValuationReportItem,
} from "@commerceflow/types";

import type {
  InventoryItemFact,
  InventoryMovementFact,
} from "../repositories/inventory-report.repository";

export function mapMovementToReportRow(
  fact: InventoryMovementFact,
): InventoryMovementReportRow {
  return {
    movementId: fact.movementId,
    inventoryItemId: fact.inventoryItemId,
    warehouseId: fact.warehouseId,
    productVariantId: fact.productVariantId,
    movementType: fact.movementType,
    quantity: fact.quantity,
    previousQuantityOnHand: fact.previousQuantityOnHand,
    newQuantityOnHand: fact.newQuantityOnHand,
    reference: fact.reference,
    createdAt: fact.reportTimestamp,
  };
}

export function mapItemFactToValuationItem(
  fact: InventoryItemFact,
  inventoryValue: string,
): InventoryValuationReportItem {
  return {
    inventoryItemId: fact.inventoryItemId,
    warehouseId: fact.warehouseId,
    productVariantId: fact.productVariantId,
    quantityOnHand: fact.quantityOnHand,
    unitCost: fact.unitCost,
    inventoryValue,
    currency: fact.currency,
  };
}
