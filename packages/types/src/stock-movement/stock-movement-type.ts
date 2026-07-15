/** Immutable stock movement type identifiers. */
export const STOCK_MOVEMENT_TYPES = [
  "fulfillment",
  "adjustment",
  "return",
  "transfer",
] as const;

export type StockMovementType = (typeof STOCK_MOVEMENT_TYPES)[number];
