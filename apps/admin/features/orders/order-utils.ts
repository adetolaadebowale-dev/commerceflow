import type { InventoryReservation, Order, OrderStatus } from "@commerceflow/types";

export type OrderAction = "confirm" | "cancel" | "reserve" | "fulfill";

/** Derive UI-available actions from order status + reservations (backend still enforces). */
export function getAvailableOrderActions(
  order: Order,
  reservations: readonly InventoryReservation[],
): readonly OrderAction[] {
  const hasActiveReservation = reservations.some(
    (reservation) => reservation.status === "active",
  );

  if (order.status === "draft") {
    return ["confirm", "cancel"];
  }

  if (order.status === "confirmed") {
    const actions: OrderAction[] = ["cancel"];
    if (!hasActiveReservation) {
      actions.push("reserve");
    }
    if (hasActiveReservation) {
      actions.push("fulfill");
    }
    return actions;
  }

  return [];
}

export function statusLabel(status: OrderStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export interface TimelineEvent {
  readonly key: string;
  readonly label: string;
  readonly at: string | null;
  readonly complete: boolean;
}

export function buildOrderTimeline(order: Order): readonly TimelineEvent[] {
  return [
    {
      key: "created",
      label: "Created",
      at: order.createdAt,
      complete: true,
    },
    {
      key: "confirmed",
      label: "Confirmed",
      at: order.confirmedAt ?? null,
      complete: Boolean(order.confirmedAt) || order.status === "fulfilled",
    },
    {
      key: "cancelled",
      label: "Cancelled",
      at: order.cancelledAt ?? null,
      complete: Boolean(order.cancelledAt),
    },
    {
      key: "fulfilled",
      label: "Fulfilled",
      at: order.fulfilledAt ?? null,
      complete: Boolean(order.fulfilledAt),
    },
  ].filter((event) => {
    if (event.key === "cancelled") {
      return order.status === "cancelled" || Boolean(order.cancelledAt);
    }
    if (event.key === "fulfilled") {
      return order.status === "fulfilled" || Boolean(order.fulfilledAt);
    }
    return true;
  });
}
