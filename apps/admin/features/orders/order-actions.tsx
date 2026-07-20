"use client";

import type { OrderAction } from "@/features/orders/order-utils";
import { Button } from "@/components/ui/button";

export interface OrderActionsProps {
  readonly availableActions: readonly OrderAction[];
  readonly isSaving?: boolean;
  readonly onConfirm: () => void;
  readonly onCancel: () => void;
  readonly onReserve: () => void;
  readonly onFulfill: () => void;
}

const ACTION_LABELS: Record<OrderAction, string> = {
  confirm: "Confirm Order",
  cancel: "Cancel Order",
  reserve: "Reserve Inventory",
  fulfill: "Fulfill Order",
};

export function OrderActions({
  availableActions,
  isSaving = false,
  onConfirm,
  onCancel,
  onReserve,
  onFulfill,
}: OrderActionsProps) {
  if (availableActions.length === 0) {
    return (
      <p className="text-sm text-[var(--color-muted-foreground)]">
        No actions available for this order status.
      </p>
    );
  }

  const handlers: Record<OrderAction, () => void> = {
    confirm: onConfirm,
    cancel: onCancel,
    reserve: onReserve,
    fulfill: onFulfill,
  };

  return (
    <div className="flex flex-wrap gap-2">
      {availableActions.map((action) => (
        <Button
          key={action}
          type="button"
          variant={action === "cancel" ? "destructive" : "default"}
          disabled={isSaving}
          onClick={handlers[action]}
        >
          {isSaving ? "Working…" : ACTION_LABELS[action]}
        </Button>
      ))}
    </div>
  );
}
