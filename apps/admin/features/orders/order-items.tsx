"use client";

import type { OrderItem } from "@commerceflow/types";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/format";

export interface OrderItemsProps {
  readonly items: readonly OrderItem[];
  readonly currency: string;
}

export function OrderItems({ items, currency }: OrderItemsProps) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-[var(--color-muted-foreground)]">
        This order has no line items.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Product</TableHead>
          <TableHead>SKU</TableHead>
          <TableHead>Qty</TableHead>
          <TableHead>Unit price</TableHead>
          <TableHead>Line total</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.id}>
            <TableCell className="font-medium">{item.productName}</TableCell>
            <TableCell>
              <code className="text-sm">{item.sku}</code>
            </TableCell>
            <TableCell>{item.quantity}</TableCell>
            <TableCell>
              {formatCurrency(item.unitPrice, item.currency || currency)}
            </TableCell>
            <TableCell>
              {formatCurrency(item.lineSubtotal, item.currency || currency)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
