import {
  type CartPromotion as PrismaCartPromotion,
  type PrismaClient,
} from "@prisma/client";
import type { AppliedCartPromotion } from "@commerceflow/types";

import type {
  CartPromotionRepository,
  UpsertCartPromotionRecord,
} from "./cart-promotion.repository";

function toAppliedCartPromotion(
  record: PrismaCartPromotion,
): AppliedCartPromotion {
  return {
    id: record.id,
    storeId: record.storeId,
    cartId: record.cartId,
    promotionId: record.promotionId,
    promotionCodeSnapshot: record.promotionCodeSnapshot,
    promotionTypeSnapshot: record.promotionTypeSnapshot,
    promotionValueSnapshot: record.promotionValueSnapshot.toString(),
    discountAmount: record.discountAmount.toString(),
    createdAt: record.createdAt.toISOString(),
  };
}

export class PrismaCartPromotionRepository implements CartPromotionRepository {
  constructor(private readonly db: PrismaClient) {}

  async findByCartId(
    storeId: string,
    cartId: string,
  ): Promise<AppliedCartPromotion | null> {
    const record = await this.db.cartPromotion.findFirst({
      where: { storeId, cartId },
    });

    return record ? toAppliedCartPromotion(record) : null;
  }

  async upsert(record: UpsertCartPromotionRecord): Promise<AppliedCartPromotion> {
    const saved = await this.db.cartPromotion.upsert({
      where: { cartId: record.cartId },
      create: {
        storeId: record.storeId,
        cartId: record.cartId,
        promotionId: record.promotionId,
        promotionCodeSnapshot: record.promotionCodeSnapshot,
        promotionTypeSnapshot: record.promotionTypeSnapshot,
        promotionValueSnapshot: record.promotionValueSnapshot,
        discountAmount: record.discountAmount,
      },
      update: {
        promotionId: record.promotionId,
        promotionCodeSnapshot: record.promotionCodeSnapshot,
        promotionTypeSnapshot: record.promotionTypeSnapshot,
        promotionValueSnapshot: record.promotionValueSnapshot,
        discountAmount: record.discountAmount,
      },
    });

    return toAppliedCartPromotion(saved);
  }

  async updateDiscountAmount(
    storeId: string,
    cartId: string,
    discountAmount: string,
  ): Promise<AppliedCartPromotion> {
    const result = await this.db.cartPromotion.updateMany({
      where: { storeId, cartId },
      data: { discountAmount },
    });

    if (result.count === 0) {
      throw new Error(`CartPromotion not found: ${cartId}`);
    }

    const record = await this.db.cartPromotion.findFirstOrThrow({
      where: { storeId, cartId },
    });

    return toAppliedCartPromotion(record);
  }

  async remove(
    storeId: string,
    cartId: string,
  ): Promise<AppliedCartPromotion | null> {
    const existing = await this.findByCartId(storeId, cartId);

    if (!existing) {
      return null;
    }

    await this.db.cartPromotion.deleteMany({
      where: { storeId, cartId },
    });

    return existing;
  }
}
