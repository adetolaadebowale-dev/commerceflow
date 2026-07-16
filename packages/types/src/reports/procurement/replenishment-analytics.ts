import type { ReplenishmentRecommendationStatus } from "../../replenishment";
import type { ReportFilter, ReportPagination } from "../report-foundation";
import type { ReplenishmentMetrics } from "./procurement-metrics";

/** Replenishment recommendation row in procurement analytics. */
export interface ReplenishmentAnalyticsRow {
  readonly recommendationId: string;
  readonly warehouseId: string;
  readonly supplierId: string;
  readonly productVariantId: string;
  readonly recommendedQuantity: number;
  readonly currentQuantity: number;
  readonly reorderPoint: number;
  readonly status: ReplenishmentRecommendationStatus;
  readonly purchaseOrderId?: string;
  readonly reportTimestamp: string;
  readonly createdAt: string;
}

/** Paginated replenishment analytics report. */
export interface ReplenishmentAnalytics {
  readonly storeId: string;
  readonly generatedAt: string;
  readonly timezone: string;
  readonly filter: ReportFilter;
  readonly summary: ReplenishmentMetrics;
  readonly items: readonly ReplenishmentAnalyticsRow[];
  readonly pagination: ReportPagination;
}
