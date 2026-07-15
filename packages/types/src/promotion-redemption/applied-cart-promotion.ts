import type { PromotionType } from "../promotions/promotion-type";

/** Applied promotion record linked to an active shopping cart. */
export interface AppliedCartPromotion {
  readonly id: string;
  readonly storeId: string;
  readonly cartId: string;
  readonly promotionId: string;
  readonly promotionCodeSnapshot: string;
  readonly promotionTypeSnapshot: PromotionType;
  readonly promotionValueSnapshot: string;
  readonly discountAmount: string;
  readonly createdAt: string;
}
