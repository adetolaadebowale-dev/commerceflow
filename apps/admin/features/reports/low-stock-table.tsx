"use client";

import type { LowStockReportItem } from "@commerceflow/types";

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
import { formatNumber } from "@/lib/format";

export interface ReportLowStockTableProps {
  readonly title: string;
  readonly emptyTitle: string;
  readonly emptyDescription: string;
  readonly items: readonly LowStockReportItem[];
  readonly isLoading?: boolean;
}

export function ReportLowStockTable({
  title,
  emptyTitle,
  emptyDescription,
  items,
  isLoading = false,
}: ReportLowStockTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-2" aria-busy="true" aria-label={`Loading ${title}`}>
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState title={emptyTitle} description={emptyDescription} />
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Variant</TableHead>
          <TableHead>Warehouse</TableHead>
          <TableHead className="text-right">On hand</TableHead>
          <TableHead className="text-right">Available</TableHead>
          <TableHead className="text-right">Reorder point</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.inventoryItemId}>
            <TableCell className="font-mono text-xs">
              {item.productVariantId.slice(0, 8)}…
            </TableCell>
            <TableCell className="font-mono text-xs">
              {item.warehouseId.slice(0, 8)}…
            </TableCell>
            <TableCell className="text-right">
              {formatNumber(item.quantityOnHand)}
            </TableCell>
            <TableCell className="text-right">
              {formatNumber(item.quantityAvailable)}
            </TableCell>
            <TableCell className="text-right">
              {formatNumber(item.reorderPoint)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
