"use client";

import { ORDER_STATUSES } from "@commerceflow/types";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { OrderListFilters } from "@/features/orders/use-orders";
import { statusLabel } from "@/features/orders/order-utils";

interface OrderListToolbarProps {
  readonly filters: OrderListFilters;
  readonly onStatusChange: (value: OrderListFilters["status"]) => void;
}

export function OrderListToolbar({
  filters,
  onStatusChange,
}: OrderListToolbarProps) {
  return (
    <div className="grid gap-3 md:grid-cols-2 lg:max-w-md">
      <Select
        value={filters.status}
        onValueChange={(value) =>
          onStatusChange(value as OrderListFilters["status"])
        }
      >
        <SelectTrigger aria-label="Filter by status">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          {ORDER_STATUSES.map((status) => (
            <SelectItem key={status} value={status}>
              {statusLabel(status)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
