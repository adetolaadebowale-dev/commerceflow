import type { ReplenishmentRecommendationStatus } from "./replenishment-recommendation-status";

/** Warehouse-specific reorder threshold for automated replenishment. */
export interface ReplenishmentRule {
  readonly id: string;
  readonly storeId: string;
  readonly warehouseId: string;
  readonly productVariantId: string;
  readonly supplierId: string;
  readonly reorderPoint: number;
  readonly reorderQuantity: number;
  readonly minimumQuantity?: number;
  readonly maximumQuantity?: number;
  readonly isEnabled: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

/** Generated suggestion to replenish inventory below a reorder threshold. */
export interface ReplenishmentRecommendation {
  readonly id: string;
  readonly storeId: string;
  readonly warehouseId: string;
  readonly supplierId: string;
  readonly productVariantId: string;
  readonly recommendedQuantity: number;
  readonly currentQuantity: number;
  readonly reorderPoint: number;
  readonly status: ReplenishmentRecommendationStatus;
  readonly purchaseOrderId?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}
