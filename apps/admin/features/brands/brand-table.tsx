"use client";

import type { Brand } from "@commerceflow/types";

import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BrandRow } from "@/features/brands/brand-row";

export interface BrandTableProps {
  readonly items: readonly Brand[];
  readonly actionsDisabled?: boolean;
  readonly onEdit: (brand: Brand) => void;
  readonly onDeactivate: (brand: Brand) => void;
}

export function BrandTable({
  items,
  actionsDisabled = false,
  onEdit,
  onDeactivate,
}: BrandTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Slug</TableHead>
          <TableHead className="hidden md:table-cell">Description</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="hidden sm:table-cell">Created Date</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((brand) => (
          <BrandRow
            key={brand.id}
            brand={brand}
            actionsDisabled={actionsDisabled}
            onEdit={() => onEdit(brand)}
            onDeactivate={() => onDeactivate(brand)}
          />
        ))}
      </TableBody>
    </Table>
  );
}
