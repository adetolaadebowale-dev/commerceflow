import type { AppliedCartPromotion } from "@commerceflow/types";

import type {
  CartPromotionRepository,
  UpsertCartPromotionRecord,
} from "./cart-promotion.repository";

export class MemoryCartPromotionRepository implements CartPromotionRepository {
  private readonly promotionsByCartId = new Map<string, AppliedCartPromotion>();
  private transactionFailure: Error | null = null;

  setTransactionFailure(error: Error | null): void {
    this.transactionFailure = error;
  }

  async findByCartId(
    storeId: string,
    cartId: string,
  ): Promise<AppliedCartPromotion | null> {
    const record = this.promotionsByCartId.get(cartId);
    return record?.storeId === storeId ? record : null;
  }

  async upsert(record: UpsertCartPromotionRecord): Promise<AppliedCartPromotion> {
    if (this.transactionFailure) {
      throw this.transactionFailure;
    }

    const existing = this.promotionsByCartId.get(record.cartId);
    const applied: AppliedCartPromotion = {
      id: existing?.id ?? crypto.randomUUID(),
      storeId: record.storeId,
      cartId: record.cartId,
      promotionId: record.promotionId,
      promotionCodeSnapshot: record.promotionCodeSnapshot,
      promotionTypeSnapshot: record.promotionTypeSnapshot,
      promotionValueSnapshot: record.promotionValueSnapshot,
      discountAmount: record.discountAmount,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    };

    this.promotionsByCartId.set(record.cartId, applied);
    return applied;
  }

  async updateDiscountAmount(
    storeId: string,
    cartId: string,
    discountAmount: string,
  ): Promise<AppliedCartPromotion> {
    if (this.transactionFailure) {
      throw this.transactionFailure;
    }

    const existing = await this.findByCartId(storeId, cartId);

    if (!existing) {
      throw new Error(`CartPromotion not found: ${cartId}`);
    }

    const updated = { ...existing, discountAmount };
    this.promotionsByCartId.set(cartId, updated);
    return updated;
  }

  async remove(
    storeId: string,
    cartId: string,
  ): Promise<AppliedCartPromotion | null> {
    if (this.transactionFailure) {
      throw this.transactionFailure;
    }

    const existing = await this.findByCartId(storeId, cartId);

    if (!existing) {
      return null;
    }

    this.promotionsByCartId.delete(cartId);
    return existing;
  }
}
