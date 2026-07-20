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
import { OrderStatusBadge } from "@/features/orders/order-status-badge";
import type { OrderListRow } from "@/features/orders/use-orders";
import { formatCurrency, formatDateTime } from "@/lib/format";

export interface OrderTableProps {
  readonly rows: readonly OrderListRow[];
}

export function OrderTable({ rows }: OrderTableProps) {
  const router = useRouter();

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Order Number</TableHead>
          <TableHead>Customer</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Total</TableHead>
          <TableHead>Currency</TableHead>
          <TableHead className="hidden sm:table-cell">Created Date</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow
            key={row.id}
            className="cursor-pointer"
            tabIndex={0}
            role="link"
            aria-label={`View order ${row.orderNumber}`}
            onClick={() => router.push(`/dashboard/orders/${row.id}`)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                router.push(`/dashboard/orders/${row.id}`);
              }
            }}
          >
            <TableCell className="font-medium">{row.orderNumber}</TableCell>
            <TableCell>{row.customer}</TableCell>
            <TableCell>
              <OrderStatusBadge status={row.status} />
            </TableCell>
            <TableCell>{formatCurrency(row.total, row.currency)}</TableCell>
            <TableCell>{row.currency}</TableCell>
            <TableCell className="hidden sm:table-cell">
              {formatDateTime(row.createdAt)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
