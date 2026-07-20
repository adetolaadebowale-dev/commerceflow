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
import {
  LIST_REFETCH_CLASS,
  storeNotConfiguredMessage,
  unableToLoadMessage,
  unableToLoadTitle,
} from "@/lib/ui-messages";
import { useAuth } from "@/providers/auth-provider";
import { AdminApiError } from "@/types/api";

export function OrderList() {
  const { storeId } = useAuth();
  const list = useOrders(storeId);

  if (!storeId) {
    return (
      <ErrorState
        title="Store not configured"
        message={storeNotConfiguredMessage("orders")}
      />
    );
  }

  const errorMessage =
    list.error instanceof AdminApiError
      ? list.error.message
      : unableToLoadMessage("orders");

  const hasFilters = list.filters.status !== "all";

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
            <ErrorState
              title={unableToLoadTitle("orders")}
              message={errorMessage}
              action={
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => list.refetch()}
                >
                  Retry
                </Button>
              }
            />
          ) : list.rows.length === 0 ? (
            <EmptyState
              title="No orders found"
              description={
                hasFilters
                  ? "No orders match the selected status. Try clearing the filter."
                  : "Orders will appear here once customers check out."
              }
            />
          ) : (
            <>
              <div
                className={
                  list.isFetching && !list.isLoading
                    ? LIST_REFETCH_CLASS
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
