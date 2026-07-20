"use client";

import { WAREHOUSE_STATUSES } from "@commerceflow/types";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { WarehouseListFilters } from "@/features/warehouses/use-warehouses";

interface WarehouseListToolbarProps {
  readonly filters: WarehouseListFilters;
  readonly onSearchChange: (value: string) => void;
  readonly onStatusChange: (value: WarehouseListFilters["status"]) => void;
}

export function WarehouseListToolbar({
  filters,
  onSearchChange,
  onStatusChange,
}: WarehouseListToolbarProps) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <Input
        value={filters.search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="Search warehouses..."
        aria-label="Search warehouses"
      />

      <Select
        value={filters.status}
        onValueChange={(value) =>
          onStatusChange(value as WarehouseListFilters["status"])
        }
      >
        <SelectTrigger aria-label="Filter by status">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          {WAREHOUSE_STATUSES.map((status) => (
            <SelectItem key={status} value={status}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
