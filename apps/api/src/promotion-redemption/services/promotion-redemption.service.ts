import type { AppliedCartPromotion, Cart, Promotion } from "@commerceflow/types";
import type { ApplyCartPromotionInput } from "@commerceflow/validation";

import {
  getDomainEventPublisher,
  type DomainEventPublisher,
} from "@/domain-events";
import {
  calculatePromotionDiscount,
  subtractPrice,
} from "@/orders/services/order-pricing";
import {
  getPromotionRepository,
  type PromotionRepository,
} from "@/promotions/repositories";
import {
  getCartRepository,
  type CartRepository,
} from "@/shopping-cart/repositories";
import {
  PROMOTION_REDEMPTION_ERROR_CODES,
  PromotionRedemptionError,
} from "../errors";
import {
  getCartPromotionRepository,
  type CartPromotionRepository,
} from "../repositories";

export interface PromotionRedemptionServiceDependencies {
  readonly cartRepository?: CartRepository;
  readonly cartPromotionRepository?: CartPromotionRepository;
  readonly promotionRepository?: PromotionRepository;
  readonly domainEventPublisher?: DomainEventPublisher;
}

export class PromotionRedemptionService {
  private readonly cartRepository: CartRepository;
  private readonly cartPromotionRepository: CartPromotionRepository;
  private readonly promotionRepository: PromotionRepository;
  private readonly domainEventPublisher: DomainEventPublisher;

  constructor(dependencies: PromotionRedemptionServiceDependencies = {}) {
    this.cartRepository = dependencies.cartRepository ?? getCartRepository();
    this.cartPromotionRepository =
      dependencies.cartPromotionRepository ?? getCartPromotionRepository();
    this.promotionRepository =
      dependencies.promotionRepository ?? getPromotionRepository();
    this.domainEventPublisher =
      dependencies.domainEventPublisher ?? getDomainEventPublisher();
  }

  async applyPromotion(
    storeId: string,
    cartId: string,
    input: ApplyCartPromotionInput,
  ): Promise<Cart> {
    const cart = await this.requireActiveCart(storeId, cartId);
    const promotion = await this.resolveEligiblePromotion(storeId, input.code);

    this.assertCurrencyCompatible(cart, promotion);

    const discountAmount = calculatePromotionDiscount({
      subtotal: cart.subtotal,
      type: promotion.type,
      value: promotion.value,
      cartCurrency: cart.currency,
      promotionCurrency: promotion.currency,
    });

    try {
      const applied = await this.cartPromotionRepository.upsert({
        storeId,
        cartId,
        promotionId: promotion.id,
        promotionCodeSnapshot: promotion.code,
        promotionTypeSnapshot: promotion.type,
        promotionValueSnapshot: promotion.value,
        discountAmount,
      });

      this.domainEventPublisher.publishPromotionApplied(cart, applied);

      return this.enrichCart(cart, applied);
    } catch (error) {
      throw this.mapRepositoryError(error);
    }
  }

  async removePromotion(storeId: string, cartId: string): Promise<Cart> {
    const cart = await this.requireActiveCart(storeId, cartId);

    try {
      const removed = await this.cartPromotionRepository.remove(storeId, cartId);

      if (!removed) {
        throw new PromotionRedemptionError(
          PROMOTION_REDEMPTION_ERROR_CODES.PROMOTION_NOT_APPLIED,
          "No promotion is applied to this cart",
          404,
        );
      }

      this.domainEventPublisher.publishPromotionRemoved(cart, removed);
      return this.enrichCart(cart, null);
    } catch (error) {
      throw this.mapRepositoryError(error);
    }
  }

  async enrichCartWithPromotion(cart: Cart): Promise<Cart> {
    const applied = await this.cartPromotionRepository.findByCartId(
      cart.storeId,
      cart.id,
    );

    return this.enrichCart(cart, applied);
  }

  async recalculateForCart(cart: Cart): Promise<Cart> {
    const applied = await this.cartPromotionRepository.findByCartId(
      cart.storeId,
      cart.id,
    );

    if (!applied) {
      return cart;
    }

    const discountAmount = calculatePromotionDiscountFromSnapshot(
      cart.subtotal,
      applied,
      cart.currency,
    );

    try {
      const updated = await this.cartPromotionRepository.updateDiscountAmount(
        cart.storeId,
        cart.id,
        discountAmount,
      );

      return this.enrichCart(cart, updated);
    } catch (error) {
      throw this.mapRepositoryError(error);
    }
  }

  async getAppliedPromotion(
    storeId: string,
    cartId: string,
  ): Promise<AppliedCartPromotion | null> {
    return this.cartPromotionRepository.findByCartId(storeId, cartId);
  }

  enrichCart(cart: Cart, applied: AppliedCartPromotion | null): Cart {
    if (!applied) {
      return {
        ...cart,
        appliedPromotion: undefined,
        discountAmount: undefined,
        total: cart.subtotal,
      };
    }

    return {
      ...cart,
      appliedPromotion: applied,
      discountAmount: applied.discountAmount,
      total: subtractPrice(cart.subtotal, applied.discountAmount),
    };
  }

  private async requireActiveCart(storeId: string, cartId: string): Promise<Cart> {
    const cart = await this.cartRepository.findById(storeId, cartId);

    if (!cart) {
      throw new PromotionRedemptionError(
        PROMOTION_REDEMPTION_ERROR_CODES.CART_NOT_FOUND,
        "Cart not found",
        404,
      );
    }

    if (cart.status !== "active") {
      throw new PromotionRedemptionError(
        PROMOTION_REDEMPTION_ERROR_CODES.CART_NOT_ACTIVE,
        "Cart is not active",
        409,
      );
    }

    return cart;
  }

  private async resolveEligiblePromotion(
    storeId: string,
    code: string,
  ): Promise<Promotion> {
    const normalizedCode = code.trim().toUpperCase();
    const promotion = await this.promotionRepository.findActiveByCode(
      storeId,
      normalizedCode,
    );

    if (!promotion) {
      throw new PromotionRedemptionError(
        PROMOTION_REDEMPTION_ERROR_CODES.PROMOTION_NOT_FOUND,
        "Promotion not found",
        404,
      );
    }

    if (promotion.status !== "active") {
      throw new PromotionRedemptionError(
        PROMOTION_REDEMPTION_ERROR_CODES.PROMOTION_NOT_ACTIVE,
        "Promotion is not active",
        409,
      );
    }

    if (!isPromotionWithinWindow(promotion)) {
      throw new PromotionRedemptionError(
        PROMOTION_REDEMPTION_ERROR_CODES.PROMOTION_NOT_ELIGIBLE,
        "Promotion is not currently eligible",
        409,
      );
    }

    return promotion;
  }

  private assertCurrencyCompatible(cart: Cart, promotion: Promotion): void {
    if (
      promotion.type === "fixed_amount" &&
      promotion.currency &&
      cart.items.length > 0 &&
      cart.currency !== promotion.currency
    ) {
      throw new PromotionRedemptionError(
        PROMOTION_REDEMPTION_ERROR_CODES.CURRENCY_MISMATCH,
        "Promotion currency does not match cart currency",
        400,
      );
    }
  }

  private mapRepositoryError(error: unknown): PromotionRedemptionError {
    if (error instanceof PromotionRedemptionError) {
      return error;
    }

    if (
      error instanceof Error &&
      error.message.startsWith("CartPromotion not found:")
    ) {
      return new PromotionRedemptionError(
        PROMOTION_REDEMPTION_ERROR_CODES.PROMOTION_NOT_APPLIED,
        "No promotion is applied to this cart",
        404,
      );
    }

    return new PromotionRedemptionError(
      PROMOTION_REDEMPTION_ERROR_CODES.TRANSACTION_FAILED,
      "Promotion redemption transaction failed",
      500,
    );
  }
}

export function calculatePromotionDiscountFromSnapshot(
  subtotal: string,
  applied: Pick<
    AppliedCartPromotion,
    "promotionTypeSnapshot" | "promotionValueSnapshot"
  >,
  cartCurrency: string,
  promotionCurrency?: string,
): string {
  return calculatePromotionDiscount({
    subtotal,
    type: applied.promotionTypeSnapshot,
    value: applied.promotionValueSnapshot,
    cartCurrency,
    promotionCurrency,
  });
}

function isPromotionWithinWindow(promotion: Promotion): boolean {
  const now = Date.now();
  return (
    now >= new Date(promotion.startsAt).getTime() &&
    now <= new Date(promotion.endsAt).getTime()
  );
}

export const promotionRedemptionService = new PromotionRedemptionService();
