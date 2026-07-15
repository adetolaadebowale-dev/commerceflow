/** Lifecycle status for a merchant-managed promotion. */
export const PROMOTION_STATUSES = [
  "draft",
  "active",
  "inactive",
  "expired",
] as const;

export type PromotionStatus = (typeof PROMOTION_STATUSES)[number];
