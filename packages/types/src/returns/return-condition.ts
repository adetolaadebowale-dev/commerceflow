export const RETURN_CONDITIONS = [
  "new",
  "opened",
  "damaged",
  "defective",
] as const;

export type ReturnCondition = (typeof RETURN_CONDITIONS)[number];

/** Conditions eligible for inventory restock on return completion. */
export const RESTOCKABLE_RETURN_CONDITIONS = ["new", "opened"] as const;

export type RestockableReturnCondition =
  (typeof RESTOCKABLE_RETURN_CONDITIONS)[number];
