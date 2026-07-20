"use client";

import type { Customer, InventoryReservation, Order } from "@commerceflow/types";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { OrderActions } from "@/features/orders/order-actions";
import { OrderItems } from "@/features/orders/order-items";
import { OrderStatusBadge } from "@/features/orders/order-status-badge";
import { OrderTimeline } from "@/features/orders/order-timeline";
import { getAvailableOrderActions } from "@/features/orders/order-utils";
import { useCancelOrder } from "@/features/orders/use-cancel-order";
import { useConfirmOrder } from "@/features/orders/use-confirm-order";
import { useFulfillOrder } from "@/features/orders/use-fulfill-order";
import { useOrder } from "@/features/orders/use-order";
import { useReserveOrder } from "@/features/orders/use-reserve-order";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { useAuth } from "@/providers/auth-provider";
import { useToast } from "@/providers/toast-provider";
import { formatCustomerLabel } from "@/services/orders.service";
import { AdminApiError } from "@/types/api";

export function OrderDetail({ orderId }: { readonly orderId: string }) {
  const router = useRouter();
  const { storeId } = useAuth();
  const { toast } = useToast();
  const detail = useOrder(storeId, orderId);
  const confirmMutation = useConfirmOrder(storeId, orderId);
  const cancelMutation = useCancelOrder(storeId, orderId);
  const reserveMutation = useReserveOrder(storeId, orderId);
  const fulfillMutation = useFulfillOrder(storeId, orderId);

  const isSaving =
    confirmMutation.isPending ||
    cancelMutation.isPending ||
    reserveMutation.isPending ||
    fulfillMutation.isPending;

  if (!storeId) {
    return (
      <ErrorState
        title="Store not configured"
        message="Set NEXT_PUBLIC_DEFAULT_STORE_ID to a valid store UUID to load this order."
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

  if (detail.isError || !detail.order) {
    const message =
      detail.error instanceof AdminApiError
        ? detail.error.message
        : "Unable to load order.";
    return (
      <div className="mx-auto flex max-w-7xl flex-col gap-4">
        <ErrorState title="Unable to load order" message={message} />
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => detail.refetch()}>
            Retry
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/dashboard/orders">Back to orders</Link>
          </Button>
        </div>
      </div>
    );
  }

  const order = detail.order;
  const availableActions = getAvailableOrderActions(
    order,
    detail.reservations,
  );

  async function runAction(
    label: string,
    action: () => Promise<unknown>,
  ) {
    try {
      await action();
      toast(label);
    } catch (error) {
      toast(
        error instanceof AdminApiError ? error.message : `Unable to ${label.toLowerCase()}`,
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
              href="/dashboard/orders"
              className="hover:underline"
              onClick={(event) => {
                event.preventDefault();
                router.push("/dashboard/orders");
              }}
            >
              Orders
            </Link>
            {" / "}
            {order.orderNumber}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">
              {order.orderNumber}
            </h1>
            <OrderStatusBadge status={order.status} />
          </div>
          <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
            Created {formatDateTime(order.createdAt)}
          </p>
        </div>
        <Button type="button" variant="outline" asChild>
          <Link href="/dashboard/orders">Back to orders</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">Actions</CardTitle>
          <CardDescription>
            Only actions valid for the current status are shown.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OrderActions
            availableActions={availableActions}
            isSaving={isSaving}
            onConfirm={() =>
              void runAction("Order confirmed", () =>
                confirmMutation.mutateAsync(),
              )
            }
            onCancel={() =>
              void runAction("Order cancelled", () =>
                cancelMutation.mutateAsync(),
              )
            }
            onReserve={() =>
              void runAction("Inventory reserved", () =>
                reserveMutation.mutateAsync(),
              )
            }
            onFulfill={() =>
              void runAction("Order fulfilled", () =>
                fulfillMutation.mutateAsync(),
              )
            }
          />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-medium">Order summary</CardTitle>
          </CardHeader>
          <CardContent>
            <OrderSummary order={order} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">Customer</CardTitle>
          </CardHeader>
          <CardContent>
            <OrderCustomer
              order={order}
              customer={detail.customer}
              isError={detail.isCustomerError}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">Items</CardTitle>
        </CardHeader>
        <CardContent>
          <OrderItems items={order.items} currency={order.currency} />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">Status timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <OrderTimeline order={order} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">
              Inventory & fulfillment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <OrderReservationPanel
              order={order}
              reservations={detail.reservations}
              isError={detail.isReservationsError}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function OrderSummary({ order }: { readonly order: Order }) {
  const rows = [
    { label: "Subtotal", value: order.subtotal },
    { label: "Discount", value: order.discountAmount },
    { label: "Tax", value: order.taxAmount },
    { label: "Shipping", value: order.shippingAmount },
    { label: "Total", value: order.total, emphasize: true },
  ] as const;

  return (
    <dl className="space-y-3">
      {rows.map((row) =>
        row.value == null ? null : (
          <div
            key={row.label}
            className="flex items-center justify-between gap-4 text-sm"
          >
            <dt
              className={
                "emphasize" in row && row.emphasize
                  ? "font-medium"
                  : "text-[var(--color-muted-foreground)]"
              }
            >
              {row.label}
            </dt>
            <dd className={"emphasize" in row && row.emphasize ? "font-semibold" : undefined}>
              {formatCurrency(row.value, order.currency)}
            </dd>
          </div>
        ),
      )}
      <div className="flex items-center justify-between gap-4 text-sm">
        <dt className="text-[var(--color-muted-foreground)]">Currency</dt>
        <dd>{order.currency}</dd>
      </div>
      {order.shippingAddress ? (
        <div className="border-t border-[var(--color-border)] pt-3 text-sm">
          <dt className="text-[var(--color-muted-foreground)]">Ship to</dt>
          <dd className="mt-1">
            {order.shippingAddress.recipientName}
            <br />
            {order.shippingAddress.addressLine1}
            {order.shippingAddress.addressLine2 ? (
              <>
                <br />
                {order.shippingAddress.addressLine2}
              </>
            ) : null}
            <br />
            {order.shippingAddress.city}, {order.shippingAddress.stateProvince}{" "}
            {order.shippingAddress.postalCode}
            <br />
            {order.shippingAddress.countryCode}
          </dd>
        </div>
      ) : null}
    </dl>
  );
}

function OrderCustomer({
  order,
  customer,
  isError,
}: {
  readonly order: Order;
  readonly customer: Customer | null;
  readonly isError: boolean;
}) {
  const profileId = order.customerProfileId ?? order.customerId;

  if (!profileId) {
    return (
      <p className="text-sm text-[var(--color-muted-foreground)]">
        Guest checkout — no customer profile linked.
      </p>
    );
  }

  if (isError && !customer) {
    return (
      <p className="text-sm text-[var(--color-muted-foreground)]">
        {formatCustomerLabel(undefined, profileId)}
        <span className="mt-1 block text-xs">
          Customer details could not be loaded.
        </span>
      </p>
    );
  }

  return (
    <dl className="space-y-2 text-sm">
      <div>
        <dt className="text-[var(--color-muted-foreground)]">Name</dt>
        <dd className="font-medium">
          {formatCustomerLabel(customer, profileId)}
        </dd>
      </div>
      {customer ? (
        <>
          <div>
            <dt className="text-[var(--color-muted-foreground)]">Email</dt>
            <dd>{customer.email}</dd>
          </div>
          {customer.phone ? (
            <div>
              <dt className="text-[var(--color-muted-foreground)]">Phone</dt>
              <dd>{customer.phone}</dd>
            </div>
          ) : null}
        </>
      ) : (
        <p className="text-xs text-[var(--color-muted-foreground)]">
          Loading customer…
        </p>
      )}
    </dl>
  );
}

function OrderReservationPanel({
  order,
  reservations,
  isError,
}: {
  readonly order: Order;
  readonly reservations: readonly InventoryReservation[];
  readonly isError: boolean;
}) {
  const active = reservations.filter((item) => item.status === "active");
  const fulfilled = reservations.filter((item) => item.status === "fulfilled");

  if (isError) {
    return (
      <p className="text-sm text-[var(--color-muted-foreground)]">
        Unable to load reservation status.
      </p>
    );
  }

  return (
    <div className="space-y-4 text-sm">
      <div>
        <p className="font-medium">Fulfillment status</p>
        <p className="mt-1 text-[var(--color-muted-foreground)]">
          {order.status === "fulfilled"
            ? `Fulfilled ${order.fulfilledAt ? formatDateTime(order.fulfilledAt) : ""}`.trim()
            : order.status === "cancelled"
              ? "Order cancelled — will not ship"
              : order.status === "confirmed"
                ? active.length > 0
                  ? "Ready to fulfill (inventory reserved)"
                  : "Confirmed — reserve inventory before fulfilling"
                : "Awaiting confirmation"}
        </p>
      </div>

      <div>
        <p className="font-medium">Inventory reservation</p>
        {reservations.length === 0 ? (
          <p className="mt-1 text-[var(--color-muted-foreground)]">
            No reservations for this order.
          </p>
        ) : (
          <ul className="mt-2 space-y-2">
            {reservations.map((reservation) => (
              <li
                key={reservation.id}
                className="rounded-md border border-[var(--color-border)] px-3 py-2"
              >
                <span className="capitalize">{reservation.status}</span>
                {" · "}
                qty {reservation.reservedQuantity}
                <span className="mt-0.5 block text-xs text-[var(--color-muted-foreground)]">
                  Item {reservation.orderItemId.slice(0, 8)}…
                </span>
              </li>
            ))}
          </ul>
        )}
        {active.length > 0 || fulfilled.length > 0 ? (
          <p className="mt-2 text-xs text-[var(--color-muted-foreground)]">
            {active.length} active · {fulfilled.length} fulfilled ·{" "}
            {reservations.length} total
          </p>
        ) : null}
      </div>
    </div>
  );
}
