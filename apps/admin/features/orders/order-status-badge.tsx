"use client";

import type { OrderStatus } from "@commerceflow/types";

import { cn } from "@/lib/utils";
import { statusLabel } from "@/features/orders/order-utils";

const STATUS_STYLES: Record<OrderStatus, string> = {
  draft:
    "bg-[var(--color-muted)] text-[var(--color-muted-foreground)]",
  confirmed: "bg-sky-50 text-sky-800 border-sky-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
  fulfilled: "bg-emerald-50 text-emerald-800 border-emerald-200",
};

export interface OrderStatusBadgeProps {
  readonly status: OrderStatus;
}

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium capitalize",
        STATUS_STYLES[status],
      )}
    >
      {statusLabel(status)}
    </span>
  );
}
