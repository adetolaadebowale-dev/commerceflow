import type {
  InventoryItem,
  InventorySummary,
  ProductVariant,
} from "@commerceflow/types";

import {
  formatAttributeSummary,
  getVariantDisplayName,
} from "@/features/products/variants/variant-form-schema";

export type InventoryStockStatus = "ok" | "low" | "out";

export interface InventoryRow {
  readonly inventoryItemId: string;
  readonly productVariantId: string;
  readonly warehouseId: string;
  readonly sku: string;
  readonly variantSummary: string;
  readonly quantityOnHand: number;
  readonly reservedQuantity: number | null;
  readonly availableQuantity: number | null;
  readonly updatedAt: string;
  readonly stockStatus: InventoryStockStatus;
  readonly reorderPoint: number | null;
}

function variantKey(warehouseId: string, productVariantId: string): string {
  return `${warehouseId}:${productVariantId}`;
}

export function buildInventoryRows(input: {
  readonly variants: readonly ProductVariant[];
  readonly items: readonly InventoryItem[];
  readonly summary: InventorySummary | null;
}): InventoryRow[] {
  const variantsById = new Map(
    input.variants.map((variant) => [variant.id, variant]),
  );

  const metricsByKey = new Map(
    (input.summary?.byProductVariant ?? []).map((row) => [
      variantKey(row.warehouseId, row.productVariantId),
      row,
    ]),
  );

  const lowStockByItemId = new Map(
    (input.summary?.lowStockItems ?? []).map((row) => [row.inventoryItemId, row]),
  );
  const outOfStockByItemId = new Set(
    (input.summary?.outOfStockItems ?? []).map((row) => row.inventoryItemId),
  );

  return input.items.map((item) => {
    const variant = variantsById.get(item.productVariantId);
    const metrics = metricsByKey.get(
      variantKey(item.warehouseId, item.productVariantId),
    );
    const lowStock = lowStockByItemId.get(item.id);

    const quantityOnHand = metrics?.quantityOnHand ?? item.quantityOnHand;
    const reservedQuantity = metrics ? metrics.quantityReserved : null;
    const availableQuantity = metrics ? metrics.quantityAvailable : null;

    let stockStatus: InventoryStockStatus = "ok";
    if (outOfStockByItemId.has(item.id) || availableQuantity === 0) {
      stockStatus = "out";
    } else if (lowStock) {
      stockStatus = "low";
    }

    return {
      inventoryItemId: item.id,
      productVariantId: item.productVariantId,
      warehouseId: item.warehouseId,
      sku: variant?.sku ?? "—",
      variantSummary: variant
        ? getVariantDisplayName(variant)
        : formatAttributeSummary(undefined),
      quantityOnHand,
      reservedQuantity,
      availableQuantity,
      updatedAt: item.updatedAt,
      stockStatus,
      reorderPoint: lowStock?.reorderPoint ?? null,
    };
  });
}
