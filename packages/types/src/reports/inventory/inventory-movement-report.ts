import type { StockMovementType } from "../../stock-movement/stock-movement-type";
import type { ReportFilter, ReportPagination } from "../report-foundation";

/** Single stock movement row in the movement report. */
export interface InventoryMovementReportRow {
  readonly movementId: string;
  readonly inventoryItemId: string;
  readonly warehouseId: string;
  readonly productVariantId: string;
  readonly movementType: StockMovementType;
  readonly quantity: number;
  readonly previousQuantityOnHand: number;
  readonly newQuantityOnHand: number;
  readonly reference?: string;
  readonly createdAt: string;
}

/** Totals aggregated from filtered stock movements. */
export interface InventoryMovementTotals {
  readonly movementCount: number;
  readonly netQuantity: number;
  readonly quantityIn: number;
  readonly quantityOut: number;
  readonly adjustmentTotal: number;
  readonly byMovementType: Readonly<Record<StockMovementType, number>>;
}

/** Paginated stock movement report. */
export interface InventoryMovementReport {
  readonly storeId: string;
  readonly generatedAt: string;
  readonly timezone: string;
  readonly filter: ReportFilter;
  readonly items: readonly InventoryMovementReportRow[];
  readonly pagination: ReportPagination;
  readonly totals: InventoryMovementTotals;
}
