"use client";

import type { Warehouse } from "@commerceflow/types";

import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { formatDateTime } from "@/lib/format";

export interface WarehouseRowProps {
  readonly warehouse: Warehouse;
  readonly deleteDisabled?: boolean;
  readonly actionsDisabled?: boolean;
  readonly onEdit: () => void;
  readonly onDelete: () => void;
}

function statusLabel(status: Warehouse["status"]): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function WarehouseRow({
  warehouse,
  deleteDisabled = false,
  actionsDisabled = false,
  onEdit,
  onDelete,
}: WarehouseRowProps) {
  return (
    <TableRow>
      <TableCell className="font-medium">{warehouse.name}</TableCell>
      <TableCell>
        <code className="text-sm">{warehouse.code}</code>
      </TableCell>
      <TableCell>
        <span className="capitalize">{statusLabel(warehouse.status)}</span>
      </TableCell>
      <TableCell>{warehouse.isDefault ? "Yes" : "No"}</TableCell>
      <TableCell className="hidden sm:table-cell">
        {formatDateTime(warehouse.createdAt)}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={actionsDisabled}
            onClick={onEdit}
          >
            Edit
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            disabled={deleteDisabled || actionsDisabled || warehouse.isDefault}
            title={
              warehouse.isDefault
                ? "Default warehouses cannot be deleted"
                : undefined
            }
            onClick={onDelete}
          >
            Delete
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
