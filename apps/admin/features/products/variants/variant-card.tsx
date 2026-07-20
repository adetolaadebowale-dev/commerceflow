"use client";

import type { ProductVariant } from "@commerceflow/types";

import { Button } from "@/components/ui/button";
import {
  TableCell,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDateTime } from "@/lib/format";
import {
  formatAttributeSummary,
  getVariantDisplayName,
} from "@/features/products/variants/variant-form-schema";

export interface VariantCardProps {
  readonly variant: ProductVariant;
  readonly deleteDisabled?: boolean;
  readonly onEdit: () => void;
  readonly onDelete: () => void;
}

export function VariantCard({
  variant,
  deleteDisabled = false,
  onEdit,
  onDelete,
}: VariantCardProps) {
  return (
    <TableRow>
      <TableCell className="font-medium">{variant.sku}</TableCell>
      <TableCell>{getVariantDisplayName(variant)}</TableCell>
      <TableCell>
        {formatCurrency(variant.price, variant.currency)}
      </TableCell>
      <TableCell>{variant.currency}</TableCell>
      <TableCell className="hidden lg:table-cell">
        {formatAttributeSummary(variant.attributes)}
      </TableCell>
      <TableCell className="hidden md:table-cell">
        {formatDateTime(variant.createdAt)}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onEdit}>
            Edit
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            disabled={deleteDisabled}
            onClick={onDelete}
          >
            Delete
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
