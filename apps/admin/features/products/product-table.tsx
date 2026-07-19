"use client";

import { useRouter } from "next/navigation";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ProductListRow } from "@/features/products/product-list-mappers";

interface ProductTableProps {
  readonly rows: readonly ProductListRow[];
}

function statusLabel(status: ProductListRow["status"]): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function ProductTable({ rows }: ProductTableProps) {
  const router = useRouter();

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Product Name</TableHead>
          <TableHead className="hidden md:table-cell">Brand</TableHead>
          <TableHead className="hidden lg:table-cell">Category</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Price</TableHead>
          <TableHead className="hidden sm:table-cell">Updated At</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow
            key={row.id}
            className="cursor-pointer"
            tabIndex={0}
            role="link"
            aria-label={`View product ${row.name}`}
            onClick={() => router.push(`/dashboard/products/${row.id}`)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                router.push(`/dashboard/products/${row.id}`);
              }
            }}
          >
            <TableCell className="font-medium">{row.name}</TableCell>
            <TableCell className="hidden md:table-cell">{row.brand}</TableCell>
            <TableCell className="hidden lg:table-cell">
              {row.category}
            </TableCell>
            <TableCell>
              <span className="capitalize">{statusLabel(row.status)}</span>
            </TableCell>
            <TableCell>{row.price}</TableCell>
            <TableCell className="hidden sm:table-cell">
              {row.updatedAt}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
