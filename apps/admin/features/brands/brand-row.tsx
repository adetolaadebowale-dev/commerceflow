"use client";

import type { Brand } from "@commerceflow/types";

import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { BrandStatusBadge } from "@/features/brands/brand-status-badge";
import { formatDateTime } from "@/lib/format";

export interface BrandRowProps {
  readonly brand: Brand;
  readonly actionsDisabled?: boolean;
  readonly onEdit: () => void;
  readonly onDeactivate: () => void;
}

export function BrandRow({
  brand,
  actionsDisabled = false,
  onEdit,
  onDeactivate,
}: BrandRowProps) {
  return (
    <TableRow>
      <TableCell className="font-medium">{brand.name}</TableCell>
      <TableCell>
        <code className="text-sm">{brand.slug}</code>
      </TableCell>
      <TableCell className="hidden max-w-xs truncate md:table-cell">
        {brand.description?.trim() ? brand.description : "—"}
      </TableCell>
      <TableCell>
        <BrandStatusBadge />
      </TableCell>
      <TableCell className="hidden sm:table-cell">
        {formatDateTime(brand.createdAt)}
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
            disabled={actionsDisabled}
            onClick={onDeactivate}
          >
            Deactivate
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
