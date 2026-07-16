import type { PurchaseOrderStatus } from "../../purchase-orders";

/** Core procurement metrics from immutable operational snapshots. */
export interface ProcurementMetrics {
  readonly purchaseOrderCount: number;
  readonly purchaseOrderValue: string;
  readonly receivingRate: string;
  readonly partialReceivingRate: string;
  readonly transferVolume: number;
  readonly replenishmentRecommendationCount: number;
  readonly recommendationAcceptanceRate: string;
  readonly fulfillmentVolume: number;
  readonly currency: string;
}

/** Purchase order totals grouped by status. */
export interface PurchaseOrderStatusSummary {
  readonly status: PurchaseOrderStatus;
  readonly count: number;
  readonly totalValue: string;
}

/** Summary totals for purchase order analytics. */
export interface PurchaseOrderAnalyticsSummary {
  readonly purchaseOrderCount: number;
  readonly purchaseOrderValue: string;
  readonly quantityOrdered: number;
  readonly quantityReceived: number;
  readonly receivingRate: string;
  readonly partialReceivingRate: string;
  readonly currency: string;
  readonly byStatus: readonly PurchaseOrderStatusSummary[];
}

/** Receiving metrics derived from purchase order line snapshots. */
export interface ReceivingAnalytics {
  readonly totalQuantityOrdered: number;
  readonly totalQuantityReceived: number;
  readonly fullyReceivedPurchaseOrderCount: number;
  readonly partiallyReceivedPurchaseOrderCount: number;
  readonly receivingRate: string;
  readonly partialReceivingRate: string;
}

/** Internal warehouse transfer metrics. */
export interface TransferAnalytics {
  readonly transferCount: number;
  readonly transferVolume: number;
  readonly inTransitCount: number;
  readonly receivedCount: number;
  readonly pendingCount: number;
}

/** Replenishment recommendation metrics. */
export interface ReplenishmentMetrics {
  readonly recommendationCount: number;
  readonly pendingCount: number;
  readonly acceptedCount: number;
  readonly dismissedCount: number;
  readonly acceptanceRate: string;
}

/** Outbound fulfillment metrics from shipment snapshots. */
export interface FulfillmentAnalytics {
  readonly fulfillmentVolume: number;
  readonly shipmentCount: number;
  readonly shippedCount: number;
  readonly deliveredCount: number;
  readonly pendingCount: number;
}

/** Supplier performance summary totals. */
export interface SupplierAnalyticsSummary {
  readonly supplierCount: number;
  readonly purchaseOrderCount: number;
  readonly purchaseVolume: string;
  readonly averageOnTimeReceivingRate: string;
  readonly currency: string;
}

/** Warehouse performance summary totals. */
export interface WarehouseAnalyticsSummary {
  readonly warehouseCount: number;
  readonly totalThroughput: number;
  readonly averageInventoryTurnover: string;
  readonly totalTransferVolume: number;
  readonly totalFulfillmentVolume: number;
}
