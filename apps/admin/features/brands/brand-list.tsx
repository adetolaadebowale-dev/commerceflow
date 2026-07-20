"use client";

import type { Brand } from "@commerceflow/types";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import {
  Modal,
  ModalContent,
  ModalDescription,
  ModalHeader,
  ModalTitle,
} from "@/components/ui/modal";
import { Pagination } from "@/components/ui/pagination";
import { BrandDialog } from "@/features/brands/brand-dialog";
import type { BrandFormValues } from "@/features/brands/brand-form-schema";
import { toBrandPayload } from "@/features/brands/brand-form-schema";
import { BrandListToolbar } from "@/features/brands/brand-list-toolbar";
import { BrandTable } from "@/features/brands/brand-table";
import { BrandTableSkeleton } from "@/features/brands/brand-table-skeleton";
import { useCreateBrand } from "@/features/brands/use-create-brand";
import { useDeactivateBrand } from "@/features/brands/use-deactivate-brand";
import { useBrands } from "@/features/brands/use-brands";
import { useUpdateBrand } from "@/features/brands/use-update-brand";
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

export function BrandList() {
  const { storeId } = useAuth();
  const { toast } = useToast();
  const list = useBrands(storeId);
  const createMutation = useCreateBrand(storeId);
  const updateMutation = useUpdateBrand(storeId);
  const deactivateMutation = useDeactivateBrand(storeId);

  const [dialogMode, setDialogMode] = useState<"create" | "edit" | null>(null);
  const [editing, setEditing] = useState<Brand | null>(null);
  const [pendingDeactivate, setPendingDeactivate] = useState<Brand | null>(
    null,
  );

  const isSaving =
    createMutation.isPending ||
    updateMutation.isPending ||
    deactivateMutation.isPending;

  function openCreate() {
    setEditing(null);
    setDialogMode("create");
  }

  if (!storeId) {
    return (
      <ErrorState
        title="Store not configured"
        message={storeNotConfiguredMessage("brands")}
      />
    );
  }

  const errorMessage =
    list.error instanceof AdminApiError
      ? list.error.message
      : unableToLoadMessage("brands");

  const hasFilters = list.filters.search.trim().length > 0;

  async function handleSubmit(values: BrandFormValues) {
    const payload = toBrandPayload(values);
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
          : "Unable to save brand.";
      toast(message, "error");
      throw error;
    }
  }

  async function handleDeactivate() {
    if (!pendingDeactivate) {
      return;
    }

    try {
      await deactivateMutation.mutateAsync(pendingDeactivate.id);
      toast(`${pendingDeactivate.name} deactivated`);
      setPendingDeactivate(null);
    } catch (error) {
      const message =
        error instanceof AdminApiError
          ? error.message
          : "Unable to deactivate brand.";
      toast(message, "error");
    }
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Brands</h1>
          <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
            {list.isLoading
              ? "Loading brands…"
              : `${formatNumber(list.total)} brand${list.total === 1 ? "" : "s"}`}
          </p>
        </div>
        <Button type="button" onClick={openCreate}>
          Add Brand
        </Button>
      </div>

      <Card>
        <CardHeader className="gap-4">
          <CardTitle className="text-base font-medium">Brand catalogue</CardTitle>
          <BrandListToolbar
            filters={list.filters}
            onSearchChange={list.setSearch}
          />
        </CardHeader>
        <CardContent className="space-y-4">
          {list.isLoading ? (
            <BrandTableSkeleton />
          ) : list.isError ? (
            <ErrorState
              title={unableToLoadTitle("brands")}
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
              title="No brands found"
              description={
                hasFilters
                  ? "No brands match your search. Try adjusting it, or add a brand."
                  : "Create a brand to assign to catalogue products."
              }
              action={
                <Button type="button" onClick={openCreate}>
                  Add Brand
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
                <BrandTable
                  items={list.items}
                  actionsDisabled={isSaving}
                  onEdit={(brand) => {
                    setEditing(brand);
                    setDialogMode("edit");
                  }}
                  onDeactivate={(brand) => setPendingDeactivate(brand)}
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

      <BrandDialog
        open={dialogMode != null}
        mode={dialogMode === "edit" ? "edit" : "create"}
        brand={editing}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
        onOpenChange={(open) => {
          if (!open && !isSaving) {
            setDialogMode(null);
            setEditing(null);
          }
        }}
        onSubmit={handleSubmit}
      />

      <Modal
        open={pendingDeactivate != null}
        onOpenChange={(open) => {
          if (!open && !deactivateMutation.isPending) {
            setPendingDeactivate(null);
          }
        }}
      >
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Deactivate brand</ModalTitle>
            <ModalDescription>
              {pendingDeactivate
                ? `Deactivate “${pendingDeactivate.name}”? Soft-deleted brands are hidden from the catalogue and cannot be restored from Admin yet.`
                : "Deactivate this brand?"}
            </ModalDescription>
          </ModalHeader>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={deactivateMutation.isPending}
              onClick={() => setPendingDeactivate(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deactivateMutation.isPending}
              onClick={() => void handleDeactivate()}
            >
              {deactivateMutation.isPending ? "Deactivating…" : "Deactivate"}
            </Button>
          </div>
        </ModalContent>
      </Modal>
    </div>
  );
}
