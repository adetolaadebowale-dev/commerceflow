"use client";

import type { CustomerStatus } from "@commerceflow/types";

import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<CustomerStatus, string> = {
  active: "bg-emerald-50 text-emerald-800 border-emerald-200",
  inactive: "bg-[var(--color-muted)] text-[var(--color-muted-foreground)]",
};

export interface CustomerStatusBadgeProps {
  readonly status: CustomerStatus;
}

export function CustomerStatusBadge({ status }: CustomerStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium capitalize",
        STATUS_STYLES[status],
      )}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
