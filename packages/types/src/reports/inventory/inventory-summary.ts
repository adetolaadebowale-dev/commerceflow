import type { ReportFilter } from "../report-foundation";
import type {
  InventoryAdjustmentSummary,
  InventoryMetrics,
  InventoryVariantReport,
  InventoryWarehouseReport,
} from "./inventory-metrics";

/** Low-stock item row embedded in summary context. */
export interface InventoryLowStockItem {
  readonly inventoryItemId: string;
  readonly warehouseId: string;
  readonly productVariantId: string;
  readonly quantityOnHand: number;
  readonly quantityAvailable: number;
  readonly reorderPoint: number;
  readonly supplierId?: string;
}

/** Out-of-stock item row embedded in summary context. */
export interface InventoryOutOfStockItem {
  readonly inventoryItemId: string;
  readonly warehouseId: string;
  readonly productVariantId: string;
  readonly quantityOnHand: number;
  readonly quantityAvailable: number;
}

/** Comprehensive inventory summary with dimensional breakdowns. */
export interface InventorySummary {
  readonly storeId: string;
  readonly generatedAt: string;
  readonly timezone: string;
  readonly filter: ReportFilter;
  readonly metrics: InventoryMetrics;
  readonly byWarehouse: readonly InventoryWarehouseReport[];
  readonly byProductVariant: readonly InventoryVariantReport[];
  readonly lowStockItems: readonly InventoryLowStockItem[];
  readonly outOfStockItems: readonly InventoryOutOfStockItem[];
  readonly adjustmentReport: InventoryAdjustmentSummary;
}
