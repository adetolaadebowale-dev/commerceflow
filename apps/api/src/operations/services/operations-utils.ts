import type { IntegrityCheckResult, IntegrityIssue } from "@commerceflow/types";

import type { OperationsContext } from "../providers/operations-context";

export const OPERATIONS_INTEGRITY_CODES = {
  SHIPMENT_PICK_STATE_MISMATCH: "SHIPMENT_PICK_STATE_MISMATCH",
  SHIPMENT_ALLOCATION_INCOMPLETE: "SHIPMENT_ALLOCATION_INCOMPLETE",
  TRANSFER_FULFILLMENT_CONFLICT: "TRANSFER_FULFILLMENT_CONFLICT",
  PO_REPLENISHMENT_STALE: "PO_REPLENISHMENT_STALE",
  RETURN_REPLENISHMENT_MISMATCH: "RETURN_REPLENISHMENT_MISMATCH",
  ADJUSTMENT_WAREHOUSE_MISMATCH: "ADJUSTMENT_WAREHOUSE_MISMATCH",
  CYCLE_COUNT_REPLENISHMENT_STALE: "CYCLE_COUNT_REPLENISHMENT_STALE",
  ALLOCATION_NOT_RELEASED: "ALLOCATION_NOT_RELEASED",
} as const;

export function buildIntegrityResult(
  issues: readonly IntegrityIssue[],
): IntegrityCheckResult {
  return {
    valid: issues.length === 0,
    checkedAt: new Date().toISOString(),
    issues,
  };
}

export function countByStatus<T extends { readonly status: string }>(
  items: readonly T[],
): { status: string; count: number }[] {
  const counts = new Map<string, number>();

  for (const item of items) {
    counts.set(item.status, (counts.get(item.status) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([status, count]) => ({ status, count }))
    .sort((left, right) => left.status.localeCompare(right.status));
}

export type { OperationsContext };
