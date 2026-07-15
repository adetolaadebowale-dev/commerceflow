import type { PurchaseOrderStatus } from "@commerceflow/types";

const ALLOWED_TRANSITIONS: Record<
  PurchaseOrderStatus,
  readonly PurchaseOrderStatus[]
> = {
  draft: ["approved", "cancelled"],
  approved: ["ordered", "cancelled"],
  ordered: ["partially_received", "received"],
  partially_received: ["partially_received", "received"],
  received: [],
  cancelled: [],
};

export const PurchaseOrderStatusTransitionPolicy = {
  canTransition(
    from: PurchaseOrderStatus,
    to: PurchaseOrderStatus,
  ): boolean {
    return ALLOWED_TRANSITIONS[from].includes(to);
  },

  isTerminal(status: PurchaseOrderStatus): boolean {
    return status === "received" || status === "cancelled";
  },

  isImmutable(status: PurchaseOrderStatus): boolean {
    return this.isTerminal(status);
  },

  canReceive(status: PurchaseOrderStatus): boolean {
    return status === "ordered" || status === "partially_received";
  },
} as const;

export function resolvePurchaseOrderStatusAfterReceive(
  items: ReadonlyArray<{
    readonly quantityOrdered: number;
    readonly quantityReceived: number;
  }>,
): "partially_received" | "received" {
  const allComplete = items.every(
    (item) => item.quantityReceived >= item.quantityOrdered,
  );

  return allComplete ? "received" : "partially_received";
}
