"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Pagination } from "@/components/ui/pagination";
import { OrderListToolbar } from "@/features/orders/order-list-toolbar";
import { OrderTable } from "@/features/orders/order-table";
import { OrderTableSkeleton } from "@/features/orders/order-table-skeleton";
import { useOrders } from "@/features/orders/use-orders";
import { formatNumber } from "@/lib/format";
import { useAuth } from "@/providers/auth-provider";
import { AdminApiError } from "@/types/api";

export function OrderList() {
  const { storeId } = useAuth();
  const list = useOrders(storeId);

  if (!storeId) {
    return (
      <ErrorState
        title="Store not configured"
        message="Set NEXT_PUBLIC_DEFAULT_STORE_ID to a valid store UUID to load orders."
      />
    );
  }

  const errorMessage =
    list.error instanceof AdminApiError
      ? list.error.message
      : "Unable to load orders.";

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Orders</h1>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
          {list.isLoading
            ? "Loading orders…"
            : `${formatNumber(list.total)} order${list.total === 1 ? "" : "s"}`}
        </p>
      </div>

      <Card>
        <CardHeader className="gap-4">
          <CardTitle className="text-base font-medium">Order history</CardTitle>
          <OrderListToolbar
            filters={list.filters}
            onStatusChange={list.setStatus}
          />
        </CardHeader>
        <CardContent className="space-y-4">
          {list.isLoading ? (
            <OrderTableSkeleton />
          ) : list.isError ? (
            <div className="space-y-3">
              <ErrorState title="Unable to load orders" message={errorMessage} />
              <Button type="button" variant="outline" onClick={() => list.refetch()}>
                Retry
              </Button>
            </div>
          ) : list.rows.length === 0 ? (
            <EmptyState
              title="No orders found"
              description="Orders will appear here once customers check out."
            />
          ) : (
            <>
              <div
                className={
                  list.isFetching && !list.isLoading
                    ? "opacity-70 transition-opacity"
                    : undefined
                }
              >
                <OrderTable rows={list.rows} />
              </div>
              <Pagination
                page={list.filters.page}
                pageSize={list.filters.pageSize}
                total={list.total}
                totalPages={list.totalPages}
                onPageChange={list.setPage}
                onPageSizeChange={list.setPageSize}
                disabled={list.isFetching}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
