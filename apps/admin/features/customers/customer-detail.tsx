"use client";

import type { Customer, Order } from "@commerceflow/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CustomerDialog } from "@/features/customers/customer-dialog";
import type { CustomerFormValues } from "@/features/customers/customer-form-schema";
import { toCreatePayload } from "@/features/customers/customer-form-schema";
import { CustomerStatusBadge } from "@/features/customers/customer-status-badge";
import { useCustomer } from "@/features/customers/use-customer";
import { useUpdateCustomer } from "@/features/customers/use-update-customer";
import { OrderStatusBadge } from "@/features/orders/order-status-badge";
import { formatCurrency, formatDateTime, formatNumber } from "@/lib/format";
import { useAuth } from "@/providers/auth-provider";
import { useToast } from "@/providers/toast-provider";
import { formatCustomerFullName } from "@/services/customers.service";
import { AdminApiError } from "@/types/api";

function CustomerInfoCard({ customer }: { readonly customer: Customer }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-medium">
          Customer Information
        </CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-[var(--color-muted-foreground)]">Name</dt>
            <dd className="mt-1 font-medium">
              {formatCustomerFullName(customer)}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-[var(--color-muted-foreground)]">
              Email
            </dt>
            <dd className="mt-1">{customer.email}</dd>
          </div>
          <div>
            <dt className="text-sm text-[var(--color-muted-foreground)]">
              Phone
            </dt>
            <dd className="mt-1">{customer.phone ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-sm text-[var(--color-muted-foreground)]">
              Status
            </dt>
            <dd className="mt-1">
              <CustomerStatusBadge status={customer.status} />
            </dd>
          </div>
          <div>
            <dt className="text-sm text-[var(--color-muted-foreground)]">
              Created Date
            </dt>
            <dd className="mt-1">{formatDateTime(customer.createdAt)}</dd>
          </div>
          <div>
            <dt className="text-sm text-[var(--color-muted-foreground)]">
              Last Updated
            </dt>
            <dd className="mt-1">{formatDateTime(customer.updatedAt)}</dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}

function OrderSummaryCard({
  orders,
}: {
  readonly orders: readonly Order[];
}) {
  const totalSpend = orders.reduce(
    (sum, order) => sum + Number(order.total ?? 0),
    0,
  );
  const currency = orders[0]?.currency ?? "USD";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-medium">Order Summary</CardTitle>
        <CardDescription>
          Based on recent orders linked to this customer profile.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-[var(--color-muted-foreground)]">
              Recent orders
            </dt>
            <dd className="mt-1 text-lg font-semibold">
              {formatNumber(orders.length)}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-[var(--color-muted-foreground)]">
              Recent spend
            </dt>
            <dd className="mt-1 text-lg font-semibold">
              {orders.length > 0
                ? formatCurrency(totalSpend, currency)
                : "—"}
            </dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}

function RecentOrdersCard({
  orders,
  isError,
}: {
  readonly orders: readonly Order[];
  readonly isError: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-medium">Recent Orders</CardTitle>
        <CardDescription>
          Orders associated with this customer profile.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isError ? (
          <ErrorState
            title="Unable to load recent orders"
            message="Order history could not be loaded for this customer."
          />
        ) : orders.length === 0 ? (
          <EmptyState
            title="No recent orders"
            description="Orders linked to this customer will appear here."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order Number</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Total</TableHead>
                <TableHead className="hidden sm:table-cell">Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/dashboard/orders/${order.id}`}
                      className="hover:underline"
                    >
                      {order.orderNumber}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <OrderStatusBadge status={order.status} />
                  </TableCell>
                  <TableCell>
                    {formatCurrency(order.total, order.currency)}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {formatDateTime(order.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

export function CustomerDetail({
  customerId,
}: {
  readonly customerId: string;
}) {
  const router = useRouter();
  const { storeId } = useAuth();
  const { toast } = useToast();
  const detail = useCustomer(storeId, customerId);
  const updateMutation = useUpdateCustomer(storeId);
  const [editOpen, setEditOpen] = useState(false);

  if (!storeId) {
    return (
      <ErrorState
        title="Store not configured"
        message="Set NEXT_PUBLIC_DEFAULT_STORE_ID to a valid store UUID to load this customer."
      />
    );
  }

  if (detail.isLoading) {
    return (
      <div className="mx-auto flex max-w-7xl flex-col gap-6" aria-busy="true">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-56 w-full" />
      </div>
    );
  }

  if (detail.isError || !detail.customer) {
    const message =
      detail.error instanceof AdminApiError
        ? detail.error.message
        : "Unable to load customer.";
    return (
      <div className="mx-auto flex max-w-7xl flex-col gap-4">
        <ErrorState title="Unable to load customer" message={message} />
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => detail.refetch()}>
            Retry
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/dashboard/customers">Back to customers</Link>
          </Button>
        </div>
      </div>
    );
  }

  const customer = detail.customer;
  const nextStatus = customer.status === "active" ? "inactive" : "active";

  async function handleSubmit(values: CustomerFormValues) {
    try {
      await updateMutation.mutateAsync({
        id: customer.id,
        input: toCreatePayload(values),
      });
      toast("Customer updated");
      setEditOpen(false);
    } catch (error) {
      toast(
        error instanceof AdminApiError
          ? error.message
          : "Unable to save customer.",
        "error",
      );
      throw error;
    }
  }

  async function handleToggleStatus() {
    try {
      await updateMutation.mutateAsync({
        id: customer.id,
        input: { status: nextStatus },
      });
      toast(
        nextStatus === "inactive"
          ? "Customer deactivated"
          : "Customer activated",
      );
    } catch (error) {
      toast(
        error instanceof AdminApiError
          ? error.message
          : "Unable to update customer status.",
        "error",
      );
    }
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            <Link
              href="/dashboard/customers"
              className="hover:underline"
              onClick={(event) => {
                event.preventDefault();
                router.push("/dashboard/customers");
              }}
            >
              Customers
            </Link>
            {" / "}
            {formatCustomerFullName(customer)}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">
              {formatCustomerFullName(customer)}
            </h1>
            <CustomerStatusBadge status={customer.status} />
          </div>
          <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
            {customer.email}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={updateMutation.isPending}
            onClick={() => setEditOpen(true)}
          >
            Edit
          </Button>
          <Button
            type="button"
            variant={customer.status === "active" ? "destructive" : "default"}
            disabled={updateMutation.isPending}
            onClick={() => void handleToggleStatus()}
          >
            {updateMutation.isPending
              ? "Saving…"
              : customer.status === "active"
                ? "Deactivate"
                : "Activate"}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/dashboard/customers">Back to customers</Link>
          </Button>
        </div>
      </div>

      <CustomerInfoCard customer={customer} />
      <OrderSummaryCard orders={detail.recentOrders} />
      <RecentOrdersCard
        orders={detail.recentOrders}
        isError={detail.isOrdersError}
      />

      <CustomerDialog
        open={editOpen}
        mode="edit"
        customer={customer}
        isSubmitting={updateMutation.isPending}
        onOpenChange={(open) => {
          if (!open && !updateMutation.isPending) {
            setEditOpen(false);
          }
        }}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
