"use client";

import type { Customer } from "@commerceflow/types";
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
import { Pagination } from "@/components/ui/pagination";
import { CustomerDialog } from "@/features/customers/customer-dialog";
import type { CustomerFormValues } from "@/features/customers/customer-form-schema";
import { toCreatePayload } from "@/features/customers/customer-form-schema";
import { CustomerListToolbar } from "@/features/customers/customer-list-toolbar";
import { CustomerTable } from "@/features/customers/customer-table";
import { CustomerTableSkeleton } from "@/features/customers/customer-table-skeleton";
import { useCreateCustomer } from "@/features/customers/use-create-customer";
import { useCustomers } from "@/features/customers/use-customers";
import { useUpdateCustomer } from "@/features/customers/use-update-customer";
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

export function CustomerList() {
  const { storeId } = useAuth();
  const { toast } = useToast();
  const list = useCustomers(storeId);
  const createMutation = useCreateCustomer(storeId);
  const updateMutation = useUpdateCustomer(storeId);

  const [dialogMode, setDialogMode] = useState<"create" | "edit" | null>(null);
  const [editing, setEditing] = useState<Customer | null>(null);

  const isSaving = createMutation.isPending || updateMutation.isPending;

  function openCreate() {
    setEditing(null);
    setDialogMode("create");
  }

  if (!storeId) {
    return (
      <ErrorState
        title="Store not configured"
        message={storeNotConfiguredMessage("customers")}
      />
    );
  }

  const errorMessage =
    list.error instanceof AdminApiError
      ? list.error.message
      : unableToLoadMessage("customers");

  const hasFilters =
    list.filters.search.trim().length > 0 || list.filters.status !== "all";

  async function handleSubmit(values: CustomerFormValues) {
    const payload = toCreatePayload(values);
    try {
      if (dialogMode === "edit" && editing) {
        await updateMutation.mutateAsync({
          id: editing.id,
          input: payload,
        });
        toast("Customer updated");
      } else {
        await createMutation.mutateAsync(payload);
        toast("Customer created");
      }
      setDialogMode(null);
      setEditing(null);
    } catch (error) {
      const message =
        error instanceof AdminApiError
          ? error.message
          : "Unable to save customer.";
      toast(message, "error");
      throw error;
    }
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Customers</h1>
          <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
            {list.isLoading
              ? "Loading customers…"
              : `${formatNumber(list.total)} customer${list.total === 1 ? "" : "s"}`}
          </p>
        </div>
        <Button type="button" onClick={openCreate}>
          Add Customer
        </Button>
      </div>

      <Card>
        <CardHeader className="gap-4">
          <CardTitle className="text-base font-medium">Customer directory</CardTitle>
          <CustomerListToolbar
            filters={list.filters}
            onSearchChange={list.setSearch}
            onStatusChange={list.setStatus}
          />
        </CardHeader>
        <CardContent className="space-y-4">
          {list.isLoading ? (
            <CustomerTableSkeleton />
          ) : list.isError ? (
            <ErrorState
              title={unableToLoadTitle("customers")}
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
              title="No customers found"
              description={
                hasFilters
                  ? "No customers match your search or filters. Try adjusting them, or add a new customer."
                  : "Create a customer profile to start associating orders and contact details."
              }
              action={
                <Button type="button" onClick={openCreate}>
                  Add Customer
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
                <CustomerTable
                  items={list.items}
                  actionsDisabled={isSaving}
                  onEdit={(customer) => {
                    setEditing(customer);
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

      <CustomerDialog
        open={dialogMode != null}
        mode={dialogMode === "edit" ? "edit" : "create"}
        customer={editing}
        isSubmitting={isSaving}
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
