import type { ReportFilter, ReportPagination } from "../report-foundation";

/** Single inventory valuation row. */
export interface InventoryValuationReportItem {
  readonly inventoryItemId: string;
  readonly warehouseId: string;
  readonly productVariantId: string;
  readonly quantityOnHand: number;
  readonly unitCost: string;
  readonly inventoryValue: string;
  readonly currency: string;
}

/** Paginated inventory valuation report. */
export interface InventoryValuationReport {
  readonly storeId: string;
  readonly generatedAt: string;
  readonly timezone: string;
  readonly filter: ReportFilter;
  readonly items: readonly InventoryValuationReportItem[];
  readonly pagination: ReportPagination;
  readonly totalValue: string;
  readonly currency: string;
}
