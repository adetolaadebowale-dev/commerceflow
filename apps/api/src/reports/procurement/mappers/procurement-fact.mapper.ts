import type {
  InventoryItem,
  PurchaseOrder,
  ReplenishmentRecommendation,
  Shipment,
  StockMovement,
  Supplier,
  Warehouse,
  WarehouseTransfer,
} from "@commerceflow/types";

import type {
  ProcurementInventoryFact,
  ProcurementShipmentFact,
  ProcurementStockMovementFact,
  PurchaseOrderFact,
  PurchaseOrderLineFact,
  ReplenishmentRecommendationFact,
  SupplierFact,
  WarehouseFact,
  WarehouseTransferFact,
} from "../repositories/procurement-report.repository";

export function resolvePurchaseOrderReportTimestamp(
  purchaseOrder: Pick<
    PurchaseOrder,
    "orderedAt" | "receivedAt" | "createdAt"
  >,
): string {
  return purchaseOrder.receivedAt ?? purchaseOrder.orderedAt ?? purchaseOrder.createdAt;
}

export function mapPurchaseOrderToFact(purchaseOrder: PurchaseOrder): PurchaseOrderFact {
  return {
    purchaseOrderId: purchaseOrder.id,
    storeId: purchaseOrder.storeId,
    warehouseId: purchaseOrder.warehouseId,
    supplierId: purchaseOrder.supplierId,
    purchaseOrderNumber: purchaseOrder.purchaseOrderNumber,
    status: purchaseOrder.status,
    orderedAt: purchaseOrder.orderedAt,
    receivedAt: purchaseOrder.receivedAt,
    expectedDeliveryDate: purchaseOrder.expectedDeliveryDate,
    reportTimestamp: resolvePurchaseOrderReportTimestamp(purchaseOrder),
    createdAt: purchaseOrder.createdAt,
    items: purchaseOrder.items.map(mapPurchaseOrderLineToFact),
  };
}

function mapPurchaseOrderLineToFact(
  item: PurchaseOrder["items"][number],
): PurchaseOrderLineFact {
  return {
    lineId: item.id,
    purchaseOrderId: item.purchaseOrderId,
    productVariantId: item.productVariantId,
    quantityOrdered: item.quantityOrdered,
    quantityReceived: item.quantityReceived,
    unitCost: item.unitCost,
    currency: item.currency,
  };
}

export function mapSupplierToFact(supplier: Supplier): SupplierFact {
  return {
    supplierId: supplier.id,
    storeId: supplier.storeId,
    name: supplier.name,
    code: supplier.code,
    currency: supplier.currency,
    reportTimestamp: supplier.createdAt,
    createdAt: supplier.createdAt,
  };
}

export function mapWarehouseToFact(warehouse: Warehouse): WarehouseFact {
  return {
    warehouseId: warehouse.id,
    storeId: warehouse.storeId,
    name: warehouse.name,
    code: warehouse.code,
    reportTimestamp: warehouse.createdAt,
    createdAt: warehouse.createdAt,
  };
}

export function mapReplenishmentRecommendationToFact(
  recommendation: ReplenishmentRecommendation,
): ReplenishmentRecommendationFact {
  return {
    recommendationId: recommendation.id,
    storeId: recommendation.storeId,
    warehouseId: recommendation.warehouseId,
    supplierId: recommendation.supplierId,
    productVariantId: recommendation.productVariantId,
    recommendedQuantity: recommendation.recommendedQuantity,
    currentQuantity: recommendation.currentQuantity,
    reorderPoint: recommendation.reorderPoint,
    status: recommendation.status,
    purchaseOrderId: recommendation.purchaseOrderId,
    reportTimestamp: recommendation.createdAt,
    createdAt: recommendation.createdAt,
  };
}

export function mapWarehouseTransferToFact(
  transfer: WarehouseTransfer,
): WarehouseTransferFact {
  const quantity = transfer.items.reduce((total, item) => total + item.quantity, 0);

  return {
    transferId: transfer.id,
    storeId: transfer.storeId,
    transferNumber: transfer.transferNumber,
    sourceWarehouseId: transfer.sourceWarehouseId,
    destinationWarehouseId: transfer.destinationWarehouseId,
    status: transfer.status,
    quantity,
    reportTimestamp:
      transfer.receivedAt ??
      transfer.shippedAt ??
      transfer.approvedAt ??
      transfer.createdAt,
    createdAt: transfer.createdAt,
    approvedAt: transfer.approvedAt,
    shippedAt: transfer.shippedAt,
    receivedAt: transfer.receivedAt,
  };
}

export function mapStockMovementToFact(
  movement: StockMovement,
  productVariantId: string,
): ProcurementStockMovementFact {
  return {
    movementId: movement.id,
    storeId: movement.storeId,
    warehouseId: movement.warehouseId,
    inventoryItemId: movement.inventoryItemId,
    productVariantId,
    quantity: movement.quantity,
    reportTimestamp: movement.createdAt,
    createdAt: movement.createdAt,
  };
}

export function mapInventoryItemToFact(item: InventoryItem): ProcurementInventoryFact {
  return {
    inventoryItemId: item.id,
    storeId: item.storeId,
    warehouseId: item.warehouseId,
    productVariantId: item.productVariantId,
    quantityOnHand: item.quantityOnHand,
  };
}

export function mapShipmentToFact(shipment: Shipment): ProcurementShipmentFact {
  return {
    shipmentId: shipment.id,
    storeId: shipment.storeId,
    orderId: shipment.orderId,
    warehouseId: shipment.warehouseId,
    status: shipment.status,
    reportTimestamp:
      shipment.fulfilledAt ??
      shipment.deliveredAt ??
      shipment.shippedAt ??
      shipment.createdAt,
    createdAt: shipment.createdAt,
    shippedAt: shipment.shippedAt,
    deliveredAt: shipment.deliveredAt,
    fulfilledAt: shipment.fulfilledAt,
  };
}
