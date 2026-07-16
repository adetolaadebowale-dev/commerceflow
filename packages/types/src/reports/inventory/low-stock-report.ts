import type { ReportFilter, ReportPagination } from "../report-foundation";

/** Single low-stock inventory row. */
export interface LowStockReportItem {
  readonly inventoryItemId: string;
  readonly warehouseId: string;
  readonly productVariantId: string;
  readonly quantityOnHand: number;
  readonly quantityAvailable: number;
  readonly reorderPoint: number;
  readonly reorderQuantity: number;
  readonly supplierId?: string;
}

/** Paginated low-stock and out-of-stock report. */
export interface LowStockReport {
  readonly storeId: string;
  readonly generatedAt: string;
  readonly timezone: string;
  readonly filter: ReportFilter;
  readonly lowStockItems: readonly LowStockReportItem[];
  readonly outOfStockItems: readonly LowStockReportItem[];
  readonly pagination: ReportPagination;
}
