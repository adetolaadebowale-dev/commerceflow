import type { PaymentStatus } from "@commerceflow/types";

/**
 * Allowed payment status transitions for Sprint 6.4 internal lifecycle.
 *
 * - pending → authorized | failed | cancelled
 * - authorized → paid | failed | cancelled
 * - paid | failed | cancelled: terminal
 */
const ALLOWED_TRANSITIONS: Readonly<
  Record<PaymentStatus, readonly PaymentStatus[]>
> = {
  pending: ["authorized", "failed", "cancelled"],
  authorized: ["paid", "failed", "cancelled"],
  paid: [],
  failed: [],
  cancelled: [],
};

export const PaymentStatusTransitionPolicy = {
  allowedTargets(from: PaymentStatus): readonly PaymentStatus[] {
    return ALLOWED_TRANSITIONS[from];
  },

  canTransition(from: PaymentStatus, to: PaymentStatus): boolean {
    return ALLOWED_TRANSITIONS[from].includes(to);
  },
} as const;
