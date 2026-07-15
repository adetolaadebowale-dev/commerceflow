import type { WarehouseTransferStatus } from "@commerceflow/types";

const ALLOWED_TRANSITIONS: Record<
  WarehouseTransferStatus,
  readonly WarehouseTransferStatus[]
> = {
  draft: ["approved", "cancelled"],
  approved: ["in_transit", "cancelled"],
  in_transit: ["received"],
  received: [],
  cancelled: [],
};

export const WarehouseTransferStatusTransitionPolicy = {
  canTransition(
    from: WarehouseTransferStatus,
    to: WarehouseTransferStatus,
  ): boolean {
    return ALLOWED_TRANSITIONS[from].includes(to);
  },

  isTerminal(status: WarehouseTransferStatus): boolean {
    return status === "received" || status === "cancelled";
  },

  isImmutable(status: WarehouseTransferStatus): boolean {
    return this.isTerminal(status);
  },
} as const;
