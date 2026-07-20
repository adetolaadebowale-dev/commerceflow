"use client";

import type { SalesStatusBreakdown } from "@commerceflow/types";

import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface OrderStatusChartProps {
  readonly rows: readonly SalesStatusBreakdown[];
  readonly currency: string;
  readonly isLoading?: boolean;
}

function statusLabel(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function OrderStatusChart({
  rows,
  currency,
  isLoading = false,
}: OrderStatusChartProps) {
  if (isLoading) {
    return (
      <div className="space-y-3" aria-busy="true" aria-label="Loading order status">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-8 w-full" />
        ))}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <EmptyState
        title="No order status data"
        description="Order status breakdown will appear when orders exist for this period."
      />
    );
  }

  const maxCount = Math.max(...rows.map((row) => row.orderCount), 1);

  return (
    <ul className="space-y-3" aria-label="Orders by status">
      {rows.map((row) => {
        const width = `${Math.round((row.orderCount / maxCount) * 100)}%`;
        return (
          <li key={row.status} className="space-y-1">
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="font-medium">{statusLabel(row.status)}</span>
              <span className="text-[var(--color-muted-foreground)]">
                {formatNumber(row.orderCount)} ·{" "}
                {formatCurrency(row.netSales, currency)}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[var(--color-muted)]">
              <div
                className={cn(
                  "h-full rounded-full bg-[var(--color-primary)] transition-all",
                )}
                style={{ width }}
                role="presentation"
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
