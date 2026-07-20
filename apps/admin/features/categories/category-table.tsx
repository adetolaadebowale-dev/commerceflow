"use client";

import type { Category } from "@commerceflow/types";

import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CategoryRow } from "@/features/categories/category-row";

export interface CategoryTableProps {
  readonly items: readonly Category[];
  readonly parentNameById: ReadonlyMap<string, string>;
  readonly actionsDisabled?: boolean;
  readonly onEdit: (category: Category) => void;
}

export function CategoryTable({
  items,
  parentNameById,
  actionsDisabled = false,
  onEdit,
}: CategoryTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Slug</TableHead>
          <TableHead className="hidden md:table-cell">Parent</TableHead>
          <TableHead className="hidden lg:table-cell">Description</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="hidden sm:table-cell">Created Date</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((category) => (
          <CategoryRow
            key={category.id}
            category={category}
            parentName={
              category.parentId
                ? (parentNameById.get(category.parentId) ?? null)
                : null
            }
            actionsDisabled={actionsDisabled}
            onEdit={() => onEdit(category)}
          />
        ))}
      </TableBody>
    </Table>
  );
}
