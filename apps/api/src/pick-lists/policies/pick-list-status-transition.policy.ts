import type { PickListStatus } from "@commerceflow/types";

/**
 * Allowed pick list status transitions for Sprint 7.8.
 *
 * - pending → picking
 * - picking → picked
 * - picked → packed
 * - packed: terminal
 */
const ALLOWED_TRANSITIONS: Readonly<
  Record<PickListStatus, readonly PickListStatus[]>
> = {
  pending: ["picking"],
  picking: ["picked"],
  picked: ["packed"],
  packed: [],
};

export const PickListStatusTransitionPolicy = {
  allowedTargets(from: PickListStatus): readonly PickListStatus[] {
    return ALLOWED_TRANSITIONS[from];
  },

  canTransition(from: PickListStatus, to: PickListStatus): boolean {
    return ALLOWED_TRANSITIONS[from].includes(to);
  },

  isActive(status: PickListStatus): boolean {
    return status !== "packed";
  },
} as const;
