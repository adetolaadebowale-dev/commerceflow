"use client";

import type { InventoryStockStatus } from "@/features/inventory/inventory-mappers";

export interface InventoryBadgeProps {
  readonly status: InventoryStockStatus;
  readonly reorderPoint?: number | null;
}

export function InventoryBadge({
  status,
  reorderPoint = null,
}: InventoryBadgeProps) {
  if (status === "out") {
    return (
      <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
        Out of stock
      </span>
    );
  }

  if (status === "low") {
    return (
      <span
        className="inline-flex items-center rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800"
        title={
          reorderPoint != null
            ? `Reorder point: ${reorderPoint}`
            : "Below replenishment reorder point"
        }
      >
        Low stock
        {reorderPoint != null ? ` (≤ ${reorderPoint})` : null}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
      In stock
    </span>
  );
}
