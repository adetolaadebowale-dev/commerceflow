import type { ReturnStatus } from "@commerceflow/types";

/**
 * Allowed warehouse return status transitions for Sprint 8.1.
 *
 * - requested → received
 * - received → inspecting
 * - inspecting → completed | rejected
 * - completed, rejected: terminal
 */
const ALLOWED_TRANSITIONS: Readonly<
  Record<ReturnStatus, readonly ReturnStatus[]>
> = {
  requested: ["received"],
  received: ["inspecting"],
  inspecting: ["completed", "rejected"],
  completed: [],
  rejected: [],
};

export const ReturnStatusTransitionPolicy = {
  allowedTargets(from: ReturnStatus): readonly ReturnStatus[] {
    return ALLOWED_TRANSITIONS[from];
  },

  canTransition(from: ReturnStatus, to: ReturnStatus): boolean {
    return ALLOWED_TRANSITIONS[from].includes(to);
  },

  isTerminal(status: ReturnStatus): boolean {
    return status === "completed" || status === "rejected";
  },
} as const;
