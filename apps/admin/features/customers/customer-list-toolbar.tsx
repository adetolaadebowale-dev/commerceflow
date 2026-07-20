"use client";

import { CUSTOMER_STATUSES } from "@commerceflow/types";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CustomerListFilters } from "@/features/customers/use-customers";

interface CustomerListToolbarProps {
  readonly filters: CustomerListFilters;
  readonly onSearchChange: (value: string) => void;
  readonly onStatusChange: (value: CustomerListFilters["status"]) => void;
}

export function CustomerListToolbar({
  filters,
  onSearchChange,
  onStatusChange,
}: CustomerListToolbarProps) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <Input
        value={filters.search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="Search by name, email, or phone…"
        aria-label="Search customers"
      />

      <Select
        value={filters.status}
        onValueChange={(value) =>
          onStatusChange(value as CustomerListFilters["status"])
        }
      >
        <SelectTrigger aria-label="Filter by status">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          {CUSTOMER_STATUSES.map((status) => (
            <SelectItem key={status} value={status}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
