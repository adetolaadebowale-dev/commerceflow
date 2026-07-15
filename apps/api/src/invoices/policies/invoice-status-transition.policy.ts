import type { InvoiceStatus } from "@commerceflow/types";

/**
 * Allowed invoice status transitions for Sprint 6.6.
 *
 * - draft → issued | void
 * - issued → paid | void
 * - paid | void: terminal
 */
const ALLOWED_TRANSITIONS: Readonly<
  Record<InvoiceStatus, readonly InvoiceStatus[]>
> = {
  draft: ["issued", "void"],
  issued: ["paid", "void"],
  paid: [],
  void: [],
};

export const InvoiceStatusTransitionPolicy = {
  allowedTargets(from: InvoiceStatus): readonly InvoiceStatus[] {
    return ALLOWED_TRANSITIONS[from];
  },

  canTransition(from: InvoiceStatus, to: InvoiceStatus): boolean {
    return ALLOWED_TRANSITIONS[from].includes(to);
  },
} as const;
