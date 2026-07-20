"use client";

import type { InventoryMovementReportRow } from "@commerceflow/types";

import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime, formatNumber } from "@/lib/format";

export interface StockMovementsTableProps {
  readonly movements: readonly InventoryMovementReportRow[];
  readonly isLoading?: boolean;
}

function typeLabel(type: string): string {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

export function StockMovementsTable({
  movements,
  isLoading = false,
}: StockMovementsTableProps) {
  if (isLoading) {
    return (
      <div
        className="space-y-2"
        aria-busy="true"
        aria-label="Loading stock movements"
      >
        {Array.from({ length: 5 }, (_, index) => (
          <Skeleton key={index} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (movements.length === 0) {
    return (
      <EmptyState
        title="No stock movements"
        description="Recent inventory movements for this period will appear here."
      />
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Type</TableHead>
          <TableHead className="text-right">Qty</TableHead>
          <TableHead className="hidden sm:table-cell">Variant</TableHead>
          <TableHead className="hidden md:table-cell">Created</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {movements.map((movement) => (
          <TableRow key={movement.movementId}>
            <TableCell className="capitalize">
              {typeLabel(movement.movementType)}
            </TableCell>
            <TableCell className="text-right">
              {formatNumber(movement.quantity)}
            </TableCell>
            <TableCell className="hidden font-mono text-xs sm:table-cell">
              {movement.productVariantId.slice(0, 8)}…
            </TableCell>
            <TableCell className="hidden md:table-cell">
              {formatDateTime(movement.createdAt)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
