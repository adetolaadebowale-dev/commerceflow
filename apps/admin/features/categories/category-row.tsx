"use client";

import type { Category } from "@commerceflow/types";

import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { CategoryStatusBadge } from "@/features/categories/category-status-badge";
import { formatDateTime } from "@/lib/format";

export interface CategoryRowProps {
  readonly category: Category;
  readonly parentName?: string | null;
  readonly actionsDisabled?: boolean;
  readonly onEdit: () => void;
}

export function CategoryRow({
  category,
  parentName,
  actionsDisabled = false,
  onEdit,
}: CategoryRowProps) {
  return (
    <TableRow>
      <TableCell className="font-medium">{category.name}</TableCell>
      <TableCell>
        <code className="text-sm">{category.slug}</code>
      </TableCell>
      <TableCell className="hidden md:table-cell">
        {parentName?.trim() ? parentName : "—"}
      </TableCell>
      <TableCell className="hidden max-w-xs truncate lg:table-cell">
        {category.description?.trim() ? category.description : "—"}
      </TableCell>
      <TableCell>
        <CategoryStatusBadge />
      </TableCell>
      <TableCell className="hidden sm:table-cell">
        {formatDateTime(category.createdAt)}
      </TableCell>
      <TableCell className="text-right">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={actionsDisabled}
          onClick={onEdit}
        >
          Edit
        </Button>
      </TableCell>
    </TableRow>
  );
}
