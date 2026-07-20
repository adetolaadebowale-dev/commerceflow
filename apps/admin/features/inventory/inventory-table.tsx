"use client";

import { useState } from "react";

import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { InventoryAdjustDialog } from "@/features/inventory/inventory-adjust-dialog";
import { InventoryHistory } from "@/features/inventory/inventory-history";
import type { InventoryRow } from "@/features/inventory/inventory-mappers";
import { InventoryTableRow } from "@/features/inventory/inventory-row";

export interface InventoryTableProps {
  readonly storeId: string;
  readonly rows: readonly InventoryRow[];
  readonly isLoading?: boolean;
  readonly isSaving?: boolean;
  readonly onAdjust: (input: {
    inventoryItemId: string;
    movementQuantity: number;
    reason: string;
    notes?: string;
  }) => Promise<void>;
}

export function InventoryTable({
  storeId,
  rows,
  isLoading = false,
  isSaving = false,
  onAdjust,
}: InventoryTableProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [adjusting, setAdjusting] = useState<InventoryRow | null>(null);

  const selectedRow =
    rows.find((row) => row.inventoryItemId === selectedId) ?? null;

  if (isLoading) {
    return (
      <div className="space-y-2" aria-busy="true" aria-label="Loading inventory">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <EmptyState
        title="No inventory records"
        description="Inventory rows appear here once stock is created for this product’s variants in a warehouse."
      />
    );
  }

  return (
    <div className="space-y-6">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>SKU</TableHead>
            <TableHead>Variant Summary</TableHead>
            <TableHead>On Hand</TableHead>
            <TableHead>Reserved</TableHead>
            <TableHead>Available</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="hidden md:table-cell">Last Updated</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <InventoryTableRow
              key={row.inventoryItemId}
              row={row}
              selected={selectedId === row.inventoryItemId}
              onSelect={() => setSelectedId(row.inventoryItemId)}
              onAdjust={() => {
                setSelectedId(row.inventoryItemId);
                setAdjusting(row);
              }}
            />
          ))}
        </TableBody>
      </Table>

      <div className="space-y-2">
        <h3 className="text-sm font-medium">Inventory history</h3>
        <InventoryHistory
          storeId={storeId}
          inventoryItemId={selectedId}
          sku={selectedRow?.sku}
        />
      </div>

      <InventoryAdjustDialog
        open={adjusting != null}
        row={adjusting}
        isSubmitting={isSaving}
        onOpenChange={(open) => {
          if (!open) {
            setAdjusting(null);
          }
        }}
        onSubmit={onAdjust}
      />
    </div>
  );
}
