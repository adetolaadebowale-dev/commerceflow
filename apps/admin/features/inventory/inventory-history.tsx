"use client";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useInventoryHistory } from "@/features/inventory/use-inventory-history";
import { formatDateTime, formatNumber } from "@/lib/format";
import { AdminApiError } from "@/types/api";
import { useEffect, useState } from "react";

export interface InventoryHistoryProps {
  readonly storeId: string;
  readonly inventoryItemId: string | null;
  readonly sku?: string;
}

export function InventoryHistory({
  storeId,
  inventoryItemId,
  sku,
}: InventoryHistoryProps) {
  const [page, setPage] = useState(1);
  const history = useInventoryHistory(storeId, inventoryItemId, page);

  useEffect(() => {
    setPage(1);
  }, [inventoryItemId]);

  if (!inventoryItemId) {
    return (
      <EmptyState
        title="Select a variant"
        description="Choose History on an inventory row to view recent stock movements."
      />
    );
  }

  if (history.isLoading) {
    return (
      <div className="space-y-2" aria-busy="true" aria-label="Loading history">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (history.isError) {
    const message =
      history.error instanceof AdminApiError
        ? history.error.message
        : "Unable to load inventory history.";
    return (
      <div className="space-y-3">
        <ErrorState title="Unable to load history" message={message} />
        <Button type="button" variant="outline" onClick={() => history.refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  const data = history.data;

  if (!data || data.rows.length === 0) {
    return (
      <EmptyState
        title="No stock movements yet"
        description={
          sku
            ? `No movements recorded for SKU ${sku}.`
            : "No movements recorded for this inventory item."
        }
      />
    );
  }

  return (
    <div className="space-y-3">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Quantity Change</TableHead>
            <TableHead>Reason</TableHead>
            <TableHead>User</TableHead>
            <TableHead>Resulting Quantity</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell>{formatDateTime(row.createdAt)}</TableCell>
              <TableCell>
                {row.quantityChange > 0 ? "+" : ""}
                {formatNumber(row.quantityChange)}
              </TableCell>
              <TableCell className="capitalize">
                {row.reason.replaceAll("_", " ")}
              </TableCell>
              <TableCell>{row.userLabel ?? "—"}</TableCell>
              <TableCell>
                {row.resultingQuantity == null
                  ? "—"
                  : formatNumber(row.resultingQuantity)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {data.totalPages > 1 ? (
        <div className="flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page <= 1 || history.isFetching}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
          >
            Previous
          </Button>
          <span className="text-sm text-[var(--color-muted-foreground)]">
            Page {data.page} of {data.totalPages}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page >= data.totalPages || history.isFetching}
            onClick={() =>
              setPage((current) => Math.min(data.totalPages, current + 1))
            }
          >
            Next
          </Button>
        </div>
      ) : null}
    </div>
  );
}
