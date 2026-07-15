/** Discount calculation strategy for a promotion. */
export const PROMOTION_TYPES = ["percentage", "fixed_amount"] as const;

export type PromotionType = (typeof PROMOTION_TYPES)[number];
