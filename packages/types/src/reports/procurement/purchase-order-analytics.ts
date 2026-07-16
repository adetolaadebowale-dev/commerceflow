import type { PurchaseOrderStatus } from "../../purchase-orders";
import type { ReportFilter, ReportPagination } from "../report-foundation";
import type { PurchaseOrderAnalyticsSummary } from "./procurement-metrics";

/** Single purchase order row in procurement analytics. */
export interface PurchaseOrderAnalyticsRow {
  readonly purchaseOrderId: string;
  readonly purchaseOrderNumber: string;
  readonly supplierId: string;
  readonly warehouseId: string;
  readonly status: PurchaseOrderStatus;
  readonly totalValue: string;
  readonly quantityOrdered: number;
  readonly quantityReceived: number;
  readonly currency: string;
  readonly reportTimestamp: string;
  readonly orderedAt?: string;
  readonly receivedAt?: string;
  readonly expectedDeliveryDate?: string;
  readonly createdAt: string;
}

/** Paginated purchase order analytics report. */
export interface PurchaseOrderAnalytics {
  readonly storeId: string;
  readonly generatedAt: string;
  readonly timezone: string;
  readonly filter: ReportFilter;
  readonly summary: PurchaseOrderAnalyticsSummary;
  readonly items: readonly PurchaseOrderAnalyticsRow[];
  readonly pagination: ReportPagination;
}
