"use client";

import type { Warehouse } from "@commerceflow/types";
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
import { useCreateWarehouse } from "@/features/warehouses/use-create-warehouse";
import { useDeleteWarehouse } from "@/features/warehouses/use-delete-warehouse";
import { useUpdateWarehouse } from "@/features/warehouses/use-update-warehouse";
import { useWarehouses } from "@/features/warehouses/use-warehouses";
import { WarehouseDialog } from "@/features/warehouses/warehouse-dialog";
import type { WarehouseFormValues } from "@/features/warehouses/warehouse-form-schema";
import { WarehouseListToolbar } from "@/features/warehouses/warehouse-list-toolbar";
import { WarehouseTable } from "@/features/warehouses/warehouse-table";
import { WarehouseTableSkeleton } from "@/features/warehouses/warehouse-table-skeleton";
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

export function WarehouseList() {
  const { storeId } = useAuth();
  const { toast } = useToast();
  const list = useWarehouses(storeId);
  const createMutation = useCreateWarehouse(storeId);
  const updateMutation = useUpdateWarehouse(storeId);
  const deleteMutation = useDeleteWarehouse(storeId);

  const [dialogMode, setDialogMode] = useState<"create" | "edit" | null>(null);
  const [editing, setEditing] = useState<Warehouse | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Warehouse | null>(null);

  const isSaving =
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending;

  function openCreate() {
    setEditing(null);
    setDialogMode("create");
  }

  if (!storeId) {
    return (
      <ErrorState
        title="Store not configured"
        message={storeNotConfiguredMessage("warehouses")}
      />
    );
  }

  const errorMessage =
    list.error instanceof AdminApiError
      ? list.error.message
      : unableToLoadMessage("warehouses");

  const hasFilters =
    list.filters.search.trim().length > 0 || list.filters.status !== "all";

  async function handleSubmit(values: WarehouseFormValues) {
    try {
      if (dialogMode === "edit" && editing) {
        await updateMutation.mutateAsync({
          id: editing.id,
          input: values,
        });
        toast(`${values.name} updated`);
      } else {
        await createMutation.mutateAsync(values);
        toast(`${values.name} created`);
      }
      setDialogMode(null);
      setEditing(null);
    } catch (error) {
      const message =
        error instanceof AdminApiError
          ? error.message
          : "Unable to save warehouse.";
      toast(message, "error");
      throw error;
    }
  }

  async function handleDelete() {
    if (!pendingDelete) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(pendingDelete.id);
      toast(`${pendingDelete.name} deleted`);
      setPendingDelete(null);
    } catch (error) {
      const message =
        error instanceof AdminApiError
          ? error.message
          : "Unable to delete warehouse.";
      toast(message, "error");
    }
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Warehouses</h1>
          <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
            {list.isLoading
              ? "Loading warehouses…"
              : `${formatNumber(list.total)} warehouse${list.total === 1 ? "" : "s"}`}
          </p>
        </div>
        <Button type="button" onClick={openCreate}>
          Add Warehouse
        </Button>
      </div>

      <Card>
        <CardHeader className="gap-4">
          <CardTitle className="text-base font-medium">Locations</CardTitle>
          <WarehouseListToolbar
            filters={list.filters}
            onSearchChange={list.setSearch}
            onStatusChange={list.setStatus}
          />
        </CardHeader>
        <CardContent className="space-y-4">
          {list.isLoading ? (
            <WarehouseTableSkeleton />
          ) : list.isError ? (
            <ErrorState
              title={unableToLoadTitle("warehouses")}
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
              title="No warehouses found"
              description={
                hasFilters
                  ? "No warehouses match your search or filters. Try adjusting them, or add a warehouse."
                  : "Create a warehouse before initializing inventory on products."
              }
              action={
                <Button type="button" onClick={openCreate}>
                  Add Warehouse
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
                <WarehouseTable
                  items={list.items}
                  actionsDisabled={isSaving}
                  onEdit={(warehouse) => {
                    setEditing(warehouse);
                    setDialogMode("edit");
                  }}
                  onDelete={(warehouse) => setPendingDelete(warehouse)}
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

      <WarehouseDialog
        open={dialogMode != null}
        mode={dialogMode === "edit" ? "edit" : "create"}
        warehouse={editing}
        isSubmitting={
          createMutation.isPending || updateMutation.isPending
        }
        onOpenChange={(open) => {
          if (!open && !isSaving) {
            setDialogMode(null);
            setEditing(null);
          }
        }}
        onSubmit={handleSubmit}
      />

      <Modal
        open={pendingDelete != null}
        onOpenChange={(open) => {
          if (!open && !deleteMutation.isPending) {
            setPendingDelete(null);
          }
        }}
      >
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Delete warehouse</ModalTitle>
            <ModalDescription>
              {pendingDelete
                ? `Delete “${pendingDelete.name}” (${pendingDelete.code})? Default warehouses cannot be deleted.`
                : "Delete this warehouse?"}
            </ModalDescription>
          </ModalHeader>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={deleteMutation.isPending}
              onClick={() => setPendingDelete(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={
                deleteMutation.isPending || pendingDelete?.isDefault === true
              }
              onClick={() => void handleDelete()}
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete"}
            </Button>
          </div>
        </ModalContent>
      </Modal>
    </div>
  );
}
