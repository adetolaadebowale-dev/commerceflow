"use client";

import Link from "next/link";

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
import { ProductListToolbar } from "@/features/products/product-list-toolbar";
import { ProductTable } from "@/features/products/product-table";
import { ProductTableSkeleton } from "@/features/products/product-table-skeleton";
import { useProductList } from "@/features/products/use-product-list";
import { formatNumber } from "@/lib/format";
import {
  LIST_REFETCH_CLASS,
  storeNotConfiguredMessage,
  unableToLoadMessage,
  unableToLoadTitle,
} from "@/lib/ui-messages";
import { useAuth } from "@/providers/auth-provider";
import { AdminApiError } from "@/types/api";

export function ProductList() {
  const { storeId } = useAuth();
  const list = useProductList(storeId);

  if (!storeId) {
    return (
      <ErrorState
        title="Store not configured"
        message={storeNotConfiguredMessage("products")}
      />
    );
  }

  const errorMessage =
    list.error instanceof AdminApiError
      ? list.error.message
      : unableToLoadMessage("products");

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Products</h1>
          <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
            {list.isLoading
              ? "Loading products…"
              : `${formatNumber(list.total)} product${list.total === 1 ? "" : "s"}`}
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/products/new">Add Product</Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="gap-4">
          <CardTitle className="text-base font-medium">Catalogue</CardTitle>
          <ProductListToolbar
            filters={list.filters}
            brands={list.brands}
            categories={list.categories}
            onSearchChange={list.setSearch}
            onStatusChange={list.setStatus}
            onBrandChange={list.setBrandId}
            onCategoryChange={list.setCategoryId}
          />
        </CardHeader>
        <CardContent className="space-y-4">
          {list.isLoading ? (
            <ProductTableSkeleton />
          ) : list.isError ? (
            <ErrorState
              title={unableToLoadTitle("products")}
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
              title="No products found"
              description="Try adjusting search or filters, or add a new product to get started."
              action={
                <Button asChild>
                  <Link href="/dashboard/products/new">Add Product</Link>
                </Button>
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
                <ProductTable rows={list.rows} />
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
