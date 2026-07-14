/** Reasons recorded on immutable stock movement ledger entries. */
export const STOCK_MOVEMENT_REASONS = [
  "initial",
  "manual_adjustment",
  "sale_reserved_ready",
] as const;

export type StockMovementReason =
  (typeof STOCK_MOVEMENT_REASONS)[number];

/** Adjustment reasons allowed when recording stock movements via the API. */
export const ADJUSTMENT_STOCK_MOVEMENT_REASONS = [
  "manual_adjustment",
  "sale_reserved_ready",
] as const;

export type AdjustmentStockMovementReason =
  (typeof ADJUSTMENT_STOCK_MOVEMENT_REASONS)[number];
