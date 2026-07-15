import type { RefundStatus } from "@commerceflow/types";

/**
 * Allowed refund status transitions for Sprint 6.7.
 *
 * - pending → completed | cancelled
 * - completed | cancelled: terminal
 */
const ALLOWED_TRANSITIONS: Readonly<
  Record<RefundStatus, readonly RefundStatus[]>
> = {
  pending: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

export const RefundStatusTransitionPolicy = {
  allowedTargets(from: RefundStatus): readonly RefundStatus[] {
    return ALLOWED_TRANSITIONS[from];
  },

  canTransition(from: RefundStatus, to: RefundStatus): boolean {
    return ALLOWED_TRANSITIONS[from].includes(to);
  },
} as const;
