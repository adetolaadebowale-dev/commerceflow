import type {
  PurchaseOrderAnalyticsRow,
  ReplenishmentAnalyticsRow,
  SupplierAnalyticsRow,
  WarehouseAnalyticsRow,
} from "@commerceflow/types";

import type {
  PurchaseOrderFact,
  ReplenishmentRecommendationFact,
  SupplierFact,
  WarehouseFact,
} from "../repositories/procurement-report.repository";
import { computePurchaseOrderLineTotals } from "../services/procurement-aggregation";

export function mapPurchaseOrderFactToRow(
  fact: PurchaseOrderFact,
): PurchaseOrderAnalyticsRow {
  const totals = computePurchaseOrderLineTotals(fact.items);

  return {
    purchaseOrderId: fact.purchaseOrderId,
    purchaseOrderNumber: fact.purchaseOrderNumber,
    supplierId: fact.supplierId,
    warehouseId: fact.warehouseId,
    status: fact.status,
    totalValue: totals.totalValue,
    quantityOrdered: totals.quantityOrdered,
    quantityReceived: totals.quantityReceived,
    currency: totals.currency,
    reportTimestamp: fact.reportTimestamp,
    orderedAt: fact.orderedAt,
    receivedAt: fact.receivedAt,
    expectedDeliveryDate: fact.expectedDeliveryDate,
    createdAt: fact.createdAt,
  };
}

export function mapSupplierFactToRow(
  fact: SupplierFact,
  metrics: {
    readonly purchaseOrderCount: number;
    readonly purchaseVolume: string;
    readonly onTimeReceivingRate: string;
  },
): SupplierAnalyticsRow {
  return {
    supplierId: fact.supplierId,
    supplierName: fact.name,
    supplierCode: fact.code,
    purchaseOrderCount: metrics.purchaseOrderCount,
    purchaseVolume: metrics.purchaseVolume,
    onTimeReceivingRate: metrics.onTimeReceivingRate,
    currency: fact.currency,
    reportTimestamp: fact.reportTimestamp,
  };
}

export function mapWarehouseFactToRow(
  fact: WarehouseFact,
  metrics: {
    readonly throughput: number;
    readonly inventoryTurnover: string;
    readonly transferVolume: number;
    readonly purchaseOrderCount: number;
    readonly fulfillmentVolume: number;
  },
): WarehouseAnalyticsRow {
  return {
    warehouseId: fact.warehouseId,
    warehouseName: fact.name,
    warehouseCode: fact.code,
    throughput: metrics.throughput,
    inventoryTurnover: metrics.inventoryTurnover,
    transferVolume: metrics.transferVolume,
    purchaseOrderCount: metrics.purchaseOrderCount,
    fulfillmentVolume: metrics.fulfillmentVolume,
    reportTimestamp: fact.reportTimestamp,
  };
}

export function mapReplenishmentFactToRow(
  fact: ReplenishmentRecommendationFact,
): ReplenishmentAnalyticsRow {
  return {
    recommendationId: fact.recommendationId,
    warehouseId: fact.warehouseId,
    supplierId: fact.supplierId,
    productVariantId: fact.productVariantId,
    recommendedQuantity: fact.recommendedQuantity,
    currentQuantity: fact.currentQuantity,
    reorderPoint: fact.reorderPoint,
    status: fact.status,
    purchaseOrderId: fact.purchaseOrderId,
    reportTimestamp: fact.reportTimestamp,
    createdAt: fact.createdAt,
  };
}
