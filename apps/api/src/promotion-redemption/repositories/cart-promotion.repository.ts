import type { AppliedCartPromotion } from "@commerceflow/types";
import type { PromotionType } from "@commerceflow/types";

export interface UpsertCartPromotionRecord {
  readonly storeId: string;
  readonly cartId: string;
  readonly promotionId: string;
  readonly promotionCodeSnapshot: string;
  readonly promotionTypeSnapshot: PromotionType;
  readonly promotionValueSnapshot: string;
  readonly discountAmount: string;
}

export interface CartPromotionRepository {
  findByCartId(
    storeId: string,
    cartId: string,
  ): Promise<AppliedCartPromotion | null>;
  upsert(record: UpsertCartPromotionRecord): Promise<AppliedCartPromotion>;
  updateDiscountAmount(
    storeId: string,
    cartId: string,
    discountAmount: string,
  ): Promise<AppliedCartPromotion>;
  remove(storeId: string, cartId: string): Promise<AppliedCartPromotion | null>;
}
