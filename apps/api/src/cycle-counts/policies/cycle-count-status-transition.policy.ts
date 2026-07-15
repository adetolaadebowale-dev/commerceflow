import type { CycleCountStatus } from "@commerceflow/types";

/**
 * Allowed cycle count status transitions for Sprint 8.2.
 *
 * - draft → counting
 * - counting → completed
 * - completed → approved
 * - completed, approved: terminal (immutable)
 */
const ALLOWED_TRANSITIONS: Readonly<
  Record<CycleCountStatus, readonly CycleCountStatus[]>
> = {
  draft: ["counting"],
  counting: ["completed"],
  completed: ["approved"],
  approved: [],
};

export const CycleCountStatusTransitionPolicy = {
  allowedTargets(from: CycleCountStatus): readonly CycleCountStatus[] {
    return ALLOWED_TRANSITIONS[from];
  },

  canTransition(from: CycleCountStatus, to: CycleCountStatus): boolean {
    return ALLOWED_TRANSITIONS[from].includes(to);
  },

  isTerminal(status: CycleCountStatus): boolean {
    return status === "completed" || status === "approved";
  },

  isImmutable(status: CycleCountStatus): boolean {
    return status === "completed" || status === "approved";
  },
} as const;
