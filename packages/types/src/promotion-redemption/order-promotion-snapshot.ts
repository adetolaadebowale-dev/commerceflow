import type { PromotionType } from "../promotions/promotion-type";

/** Immutable promotion snapshot captured on an order at checkout. */
export interface OrderPromotionSnapshot {
  readonly promotionId: string;
  readonly promotionCodeSnapshot: string;
  readonly promotionTypeSnapshot: PromotionType;
  readonly promotionValueSnapshot: string;
  readonly discountAmount: string;
}
