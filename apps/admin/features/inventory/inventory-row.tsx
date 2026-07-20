"use client";

import { Button } from "@/components/ui/button";
import {
  TableCell,
  TableRow,
} from "@/components/ui/table";
import { InventoryBadge } from "@/features/inventory/inventory-badge";
import type { InventoryRow } from "@/features/inventory/inventory-mappers";
import { formatDateTime, formatNumber } from "@/lib/format";

export interface InventoryRowProps {
  readonly row: InventoryRow;
  readonly selected?: boolean;
  readonly onSelect: () => void;
  readonly onAdjust: () => void;
}

export function InventoryTableRow({
  row,
  selected = false,
  onSelect,
  onAdjust,
}: InventoryRowProps) {
  return (
    <TableRow
      className={selected ? "bg-[var(--color-muted)]/40" : undefined}
      data-state={selected ? "selected" : undefined}
    >
      <TableCell className="font-medium">{row.sku}</TableCell>
      <TableCell>{row.variantSummary}</TableCell>
      <TableCell>{formatNumber(row.quantityOnHand)}</TableCell>
      <TableCell>
        {row.reservedQuantity == null
          ? "—"
          : formatNumber(row.reservedQuantity)}
      </TableCell>
      <TableCell>
        {row.availableQuantity == null
          ? "—"
          : formatNumber(row.availableQuantity)}
      </TableCell>
      <TableCell>
        <InventoryBadge
          status={row.stockStatus}
          reorderPoint={row.reorderPoint}
        />
      </TableCell>
      <TableCell className="hidden md:table-cell">
        {formatDateTime(row.updatedAt)}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onSelect}>
            History
          </Button>
          <Button type="button" size="sm" onClick={onAdjust}>
            Adjust
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
