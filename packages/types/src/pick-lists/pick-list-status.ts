/** Warehouse pick list lifecycle statuses. */
export const PICK_LIST_STATUSES = [
  "pending",
  "picking",
  "picked",
  "packed",
] as const;

export type PickListStatus = (typeof PICK_LIST_STATUSES)[number];
