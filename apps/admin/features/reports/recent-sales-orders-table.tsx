"use client";

import type { SalesOrderReport } from "@commerceflow/types";
import Link from "next/link";

import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { OrderStatusBadge } from "@/features/orders/order-status-badge";
import { formatCurrency, formatDateTime } from "@/lib/format";

export interface RecentSalesOrdersTableProps {
  readonly orders: readonly SalesOrderReport[];
  readonly isLoading?: boolean;
}

export function RecentSalesOrdersTable({
  orders,
  isLoading = false,
}: RecentSalesOrdersTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-2" aria-busy="true" aria-label="Loading recent orders">
        {Array.from({ length: 5 }, (_, index) => (
          <Skeleton key={index} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <EmptyState
        title="No recent orders"
        description="Sales orders for this period will appear here."
      />
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Order</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Net sales</TableHead>
          <TableHead className="hidden sm:table-cell">Created</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map((order) => (
          <TableRow key={order.orderId}>
            <TableCell className="font-medium">
              <Link
                href={`/dashboard/orders/${order.orderId}`}
                className="hover:underline"
              >
                {order.orderNumber}
              </Link>
            </TableCell>
            <TableCell>
              <OrderStatusBadge status={order.orderStatus} />
            </TableCell>
            <TableCell>
              {formatCurrency(order.netSales, order.currency)}
            </TableCell>
            <TableCell className="hidden sm:table-cell">
              {formatDateTime(order.createdAt)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
