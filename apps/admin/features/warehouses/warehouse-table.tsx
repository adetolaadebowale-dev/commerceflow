"use client";

import type { Warehouse } from "@commerceflow/types";

import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { WarehouseRow } from "@/features/warehouses/warehouse-row";

export interface WarehouseTableProps {
  readonly items: readonly Warehouse[];
  readonly actionsDisabled?: boolean;
  readonly onEdit: (warehouse: Warehouse) => void;
  readonly onDelete: (warehouse: Warehouse) => void;
}

export function WarehouseTable({
  items,
  actionsDisabled = false,
  onEdit,
  onDelete,
}: WarehouseTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Code</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Default</TableHead>
          <TableHead className="hidden sm:table-cell">Created Date</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((warehouse) => (
          <WarehouseRow
            key={warehouse.id}
            warehouse={warehouse}
            actionsDisabled={actionsDisabled}
            deleteDisabled={warehouse.isDefault}
            onEdit={() => onEdit(warehouse)}
            onDelete={() => onDelete(warehouse)}
          />
        ))}
      </TableBody>
    </Table>
  );
}
