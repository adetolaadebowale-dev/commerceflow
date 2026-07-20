"use client";

import type { SalesStatusBreakdown } from "@commerceflow/types";

import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNumber } from "@/lib/format";

export interface FulfillmentProgressProps {
  readonly byStatus: readonly SalesStatusBreakdown[];
  readonly fulfillmentVolume: number;
  readonly isLoading?: boolean;
}

export function FulfillmentProgress({
  byStatus,
  fulfillmentVolume,
  isLoading = false,
}: FulfillmentProgressProps) {
  if (isLoading) {
    return (
      <div className="space-y-3" aria-busy="true" aria-label="Loading fulfillment">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-4 w-32" />
      </div>
    );
  }

  const totalOrders = byStatus.reduce((sum, row) => sum + row.orderCount, 0);
  const fulfilled =
    byStatus.find((row) => row.status === "fulfilled")?.orderCount ?? 0;
  const confirmed =
    byStatus.find((row) => row.status === "confirmed")?.orderCount ?? 0;
  const draft = byStatus.find((row) => row.status === "draft")?.orderCount ?? 0;
  const cancelled =
    byStatus.find((row) => row.status === "cancelled")?.orderCount ?? 0;

  if (totalOrders === 0) {
    return (
      <EmptyState
        title="No fulfillment data"
        description="Fulfillment progress will appear once orders are placed in this period."
      />
    );
  }

  const percent =
    totalOrders > 0 ? Math.round((fulfilled / totalOrders) * 100) : 0;

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">Fulfilled</span>
          <span className="text-[var(--color-muted-foreground)]">
            {formatNumber(fulfilled)} of {formatNumber(totalOrders)} ({percent}%)
          </span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--color-muted)]">
          <div
            className="h-full rounded-full bg-emerald-600 transition-all"
            style={{ width: `${percent}%` }}
            role="progressbar"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Fulfillment rate"
          />
        </div>
      </div>

      <dl className="grid gap-3 sm:grid-cols-2">
        <div>
          <dt className="text-xs text-[var(--color-muted-foreground)]">
            Confirmed
          </dt>
          <dd className="text-lg font-semibold">{formatNumber(confirmed)}</dd>
        </div>
        <div>
          <dt className="text-xs text-[var(--color-muted-foreground)]">Draft</dt>
          <dd className="text-lg font-semibold">{formatNumber(draft)}</dd>
        </div>
        <div>
          <dt className="text-xs text-[var(--color-muted-foreground)]">
            Cancelled
          </dt>
          <dd className="text-lg font-semibold">{formatNumber(cancelled)}</dd>
        </div>
        <div>
          <dt className="text-xs text-[var(--color-muted-foreground)]">
            Fulfillment volume
          </dt>
          <dd className="text-lg font-semibold">
            {formatNumber(fulfillmentVolume)}
          </dd>
        </div>
      </dl>
    </div>
  );
}
