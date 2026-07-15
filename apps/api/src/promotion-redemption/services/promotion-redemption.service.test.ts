import { describe, expect, it } from "vitest";

import { PROMOTION_REDEMPTION_ERROR_CODES } from "../errors";
import {
  createMemoryPromotionRedemptionModule,
  seedCartWithItem,
  TEST_STORE_A_ID,
  TEST_STORE_B_ID,
  validActivePromotionInput,
} from "../testing/promotion-redemption-test-utils";

describe("PromotionRedemptionService", () => {
  it("applies a percentage promotion to a cart", async () => {
    const module = createMemoryPromotionRedemptionModule();
    const { cart } = await seedCartWithItem(module);
    const promotion = await module.promotionRepository.create(
      validActivePromotionInput({ code: "SAVE20", value: "20" }),
    );

    const result = await module.promotionRedemptionService.applyPromotion(
      TEST_STORE_A_ID,
      cart.id,
      { code: "save20" },
    );

    expect(result.appliedPromotion?.promotionId).toBe(promotion.id);
    expect(result.appliedPromotion?.promotionCodeSnapshot).toBe("SAVE20");
    expect(result.discountAmount).toBe("20.00");
    expect(result.total).toBe("80.00");
  });

  it("replaces an existing applied promotion", async () => {
    const module = createMemoryPromotionRedemptionModule();
    const { cart } = await seedCartWithItem(module);
    await module.promotionRepository.create(
      validActivePromotionInput({ code: "SAVE10", value: "10" }),
    );
    await module.promotionRepository.create(
      validActivePromotionInput({ code: "SAVE25", value: "25" }),
    );

    await module.promotionRedemptionService.applyPromotion(
      TEST_STORE_A_ID,
      cart.id,
      { code: "SAVE10" },
    );

    const replaced = await module.promotionRedemptionService.applyPromotion(
      TEST_STORE_A_ID,
      cart.id,
      { code: "SAVE25" },
    );

    expect(replaced.appliedPromotion?.promotionCodeSnapshot).toBe("SAVE25");
    expect(replaced.discountAmount).toBe("25.00");
    expect(replaced.total).toBe("75.00");
  });

  it("rejects inactive promotions", async () => {
    const module = createMemoryPromotionRedemptionModule();
    const { cart } = await seedCartWithItem(module);
    await module.promotionRepository.create(
      validActivePromotionInput({ code: "DRAFT", status: "draft" }),
    );

    await expect(
      module.promotionRedemptionService.applyPromotion(
        TEST_STORE_A_ID,
        cart.id,
        { code: "DRAFT" },
      ),
    ).rejects.toMatchObject({
      code: PROMOTION_REDEMPTION_ERROR_CODES.PROMOTION_NOT_FOUND,
      status: 404,
    });
  });

  it("rejects expired promotions", async () => {
    const module = createMemoryPromotionRedemptionModule();
    const { cart } = await seedCartWithItem(module);
    await module.promotionRepository.create(
      validActivePromotionInput({
        code: "EXPIRED",
        startsAt: "2020-01-01T00:00:00.000Z",
        endsAt: "2020-12-31T23:59:59.000Z",
      }),
    );

    await expect(
      module.promotionRedemptionService.applyPromotion(
        TEST_STORE_A_ID,
        cart.id,
        { code: "EXPIRED" },
      ),
    ).rejects.toMatchObject({
      code: PROMOTION_REDEMPTION_ERROR_CODES.PROMOTION_NOT_ELIGIBLE,
      status: 409,
    });
  });

  it("applies fixed amount promotions", async () => {
    const module = createMemoryPromotionRedemptionModule();
    const { cart } = await seedCartWithItem(module);
    await module.promotionRepository.create(
      validActivePromotionInput({
        code: "FLAT15",
        type: "fixed_amount",
        value: "15.00",
        currency: "USD",
      }),
    );

    const result = await module.promotionRedemptionService.applyPromotion(
      TEST_STORE_A_ID,
      cart.id,
      { code: "FLAT15" },
    );

    expect(result.discountAmount).toBe("15.00");
    expect(result.total).toBe("85.00");
  });

  it("removes an applied promotion", async () => {
    const module = createMemoryPromotionRedemptionModule();
    const { cart } = await seedCartWithItem(module);
    await module.promotionRepository.create(
      validActivePromotionInput({ code: "REMOVE" }),
    );
    await module.promotionRedemptionService.applyPromotion(
      TEST_STORE_A_ID,
      cart.id,
      { code: "REMOVE" },
    );

    const result = await module.promotionRedemptionService.removePromotion(
      TEST_STORE_A_ID,
      cart.id,
    );

    expect(result.appliedPromotion).toBeUndefined();
    expect(result.total).toBe("100.00");
  });

  it("isolates promotion redemption by store", async () => {
    const module = createMemoryPromotionRedemptionModule();
    const { cart } = await seedCartWithItem(module);
    await module.promotionRepository.create(
      validActivePromotionInput({ code: "STOREA" }),
    );

    await expect(
      module.promotionRedemptionService.applyPromotion(
        TEST_STORE_B_ID,
        cart.id,
        { code: "STOREA" },
      ),
    ).rejects.toMatchObject({
      code: PROMOTION_REDEMPTION_ERROR_CODES.CART_NOT_FOUND,
      status: 404,
    });
  });

  it("rolls back when the transaction fails", async () => {
    const module = createMemoryPromotionRedemptionModule();
    const { cart } = await seedCartWithItem(module);
    await module.promotionRepository.create(
      validActivePromotionInput({ code: "FAIL" }),
    );

    module.cartPromotionRepository.setTransactionFailure(new Error("db failure"));

    await expect(
      module.promotionRedemptionService.applyPromotion(
        TEST_STORE_A_ID,
        cart.id,
        { code: "FAIL" },
      ),
    ).rejects.toMatchObject({
      code: PROMOTION_REDEMPTION_ERROR_CODES.TRANSACTION_FAILED,
      status: 500,
    });

    const applied = await module.cartPromotionRepository.findByCartId(
      TEST_STORE_A_ID,
      cart.id,
    );
    expect(applied).toBeNull();
  });
});

describe("PromotionRedemption checkout integration", () => {
  it("snapshots applied promotion into the order at checkout", async () => {
    const module = createMemoryPromotionRedemptionModule();
    const { address, cart } = await seedCartWithItem(module);
    await module.promotionRepository.create(
      validActivePromotionInput({ code: "CHECKOUT20", value: "20" }),
    );

    await module.promotionRedemptionService.applyPromotion(
      TEST_STORE_A_ID,
      cart.id,
      { code: "CHECKOUT20" },
    );

    const result = await module.checkoutService.checkoutCart(
      TEST_STORE_A_ID,
      cart.id,
      { customerAddressId: address.id },
    );

    expect(result.order.subtotal).toBe("100.00");
    expect(result.order.discountAmount).toBe("20.00");
    expect(result.order.total).toBe("80.00");
    expect(result.order.appliedPromotion).toMatchObject({
      promotionCodeSnapshot: "CHECKOUT20",
      promotionTypeSnapshot: "percentage",
      promotionValueSnapshot: "20",
      discountAmount: "20.00",
    });
  });

  it("keeps historical order totals when the live promotion changes", async () => {
    const module = createMemoryPromotionRedemptionModule();
    const { address, cart } = await seedCartWithItem(module);
    const promotion = await module.promotionRepository.create(
      validActivePromotionInput({ code: "HISTORIC", value: "10" }),
    );

    await module.promotionRedemptionService.applyPromotion(
      TEST_STORE_A_ID,
      cart.id,
      { code: "HISTORIC" },
    );

    const checkout = await module.checkoutService.checkoutCart(
      TEST_STORE_A_ID,
      cart.id,
      { customerAddressId: address.id },
    );

    await module.promotionRepository.update(TEST_STORE_A_ID, promotion.id, {
      value: "50",
    });

    expect(checkout.order.appliedPromotion?.promotionValueSnapshot).toBe("10");
    expect(checkout.order.discountAmount).toBe("10.00");
    expect(checkout.order.total).toBe("90.00");
  });
});
