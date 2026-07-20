"use client";

import type { Category } from "@commerceflow/types";
import { useMemo, useState } from "react";

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
import { CategoryDialog } from "@/features/categories/category-dialog";
import type { CategoryFormValues } from "@/features/categories/category-form-schema";
import { toCategoryPayload } from "@/features/categories/category-form-schema";
import { CategoryListToolbar } from "@/features/categories/category-list-toolbar";
import { CategoryTable } from "@/features/categories/category-table";
import { CategoryTableSkeleton } from "@/features/categories/category-table-skeleton";
import { useCategories } from "@/features/categories/use-categories";
import { useCategoryOptions } from "@/features/categories/use-category-options";
import { useCreateCategory } from "@/features/categories/use-create-category";
import { useUpdateCategory } from "@/features/categories/use-update-category";
import { formatNumber } from "@/lib/format";
import {
  LIST_REFETCH_CLASS,
  storeNotConfiguredMessage,
  unableToLoadMessage,
  unableToLoadTitle,
} from "@/lib/ui-messages";
import { useAuth } from "@/providers/auth-provider";
import { useToast } from "@/providers/toast-provider";
import { AdminApiError } from "@/types/api";

export function CategoryList() {
  const { storeId } = useAuth();
  const { toast } = useToast();
  const list = useCategories(storeId);
  const optionsQuery = useCategoryOptions(storeId);
  const createMutation = useCreateCategory(storeId);
  const updateMutation = useUpdateCategory(storeId);

  const [dialogMode, setDialogMode] = useState<"create" | "edit" | null>(null);
  const [editing, setEditing] = useState<Category | null>(null);

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const parentNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const category of optionsQuery.data?.items ?? []) {
      map.set(category.id, category.name);
    }
    for (const category of list.items) {
      map.set(category.id, category.name);
    }
    return map;
  }, [list.items, optionsQuery.data?.items]);

  const parentOptions = optionsQuery.data?.items ?? list.items;

  function openCreate() {
    setEditing(null);
    setDialogMode("create");
  }

  if (!storeId) {
    return (
      <ErrorState
        title="Store not configured"
        message={storeNotConfiguredMessage("categories")}
      />
    );
  }

  const errorMessage =
    list.error instanceof AdminApiError
      ? list.error.message
      : unableToLoadMessage("categories");

  const hasFilters = list.filters.search.trim().length > 0;

  async function handleSubmit(values: CategoryFormValues) {
    const payload = toCategoryPayload(values);
    try {
      if (dialogMode === "edit" && editing) {
        await updateMutation.mutateAsync({
          id: editing.id,
          input: payload,
        });
        toast(`${values.name} updated`);
      } else {
        await createMutation.mutateAsync(payload);
        toast(`${values.name} created`);
      }
      setDialogMode(null);
      setEditing(null);
    } catch (error) {
      const message =
        error instanceof AdminApiError
          ? error.message
          : "Unable to save category.";
      toast(message, "error");
      throw error;
    }
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Categories</h1>
          <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
            {list.isLoading
              ? "Loading categories…"
              : `${formatNumber(list.total)} categor${list.total === 1 ? "y" : "ies"}`}
          </p>
        </div>
        <Button type="button" onClick={openCreate}>
          Add Category
        </Button>
      </div>

      <Card>
        <CardHeader className="gap-4">
          <CardTitle className="text-base font-medium">
            Category catalogue
          </CardTitle>
          <CategoryListToolbar
            filters={list.filters}
            onSearchChange={list.setSearch}
          />
        </CardHeader>
        <CardContent className="space-y-4">
          {list.isLoading ? (
            <CategoryTableSkeleton />
          ) : list.isError ? (
            <ErrorState
              title={unableToLoadTitle("categories")}
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
          ) : list.items.length === 0 ? (
            <EmptyState
              title="No categories found"
              description={
                hasFilters
                  ? "No categories match your search. Try adjusting it, or add a category."
                  : "Create a category to assign to catalogue products."
              }
              action={
                <Button type="button" onClick={openCreate}>
                  Add Category
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
                <CategoryTable
                  items={list.items}
                  parentNameById={parentNameById}
                  actionsDisabled={isSaving}
                  onEdit={(category) => {
                    setEditing(category);
                    setDialogMode("edit");
                  }}
                />
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

      <CategoryDialog
        open={dialogMode != null}
        mode={dialogMode === "edit" ? "edit" : "create"}
        category={editing}
        parentOptions={parentOptions}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
        onOpenChange={(open) => {
          if (!open && !isSaving) {
            setDialogMode(null);
            setEditing(null);
          }
        }}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
