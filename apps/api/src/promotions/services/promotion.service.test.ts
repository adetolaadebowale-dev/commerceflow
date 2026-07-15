import { describe, expect, it } from "vitest";

import { PROMOTION_ERROR_CODES } from "../errors";
import {
  createMemoryPromotionModule,
  TEST_STORE_A_ID,
  TEST_STORE_B_ID,
  validFixedAmountPromotionInput,
  validPromotionInput,
} from "../testing/promotion-test-utils";

describe("PromotionService", () => {
  it("creates, lists, gets, updates, and deletes a promotion", async () => {
    const module = createMemoryPromotionModule();
    const input = validPromotionInput();

    const created = await module.promotionService.createPromotion(input);
    expect(created.code).toBe(input.code.trim().toUpperCase());
    expect(created.status).toBe("draft");

    const listed = await module.promotionService.listPromotions({
      storeId: TEST_STORE_A_ID,
      page: 1,
      limit: 20,
    });
    expect(listed.items).toHaveLength(1);

    const fetched = await module.promotionService.getPromotion(
      TEST_STORE_A_ID,
      created.id,
    );
    expect(fetched.name).toBe(input.name);

    const updated = await module.promotionService.updatePromotion(
      TEST_STORE_A_ID,
      created.id,
      { name: "Updated Sale" },
    );
    expect(updated.name).toBe("Updated Sale");

    const deleted = await module.promotionService.softDeletePromotion(
      TEST_STORE_A_ID,
      created.id,
    );
    expect(deleted.id).toBe(created.id);

    await expect(
      module.promotionService.getPromotion(TEST_STORE_A_ID, created.id),
    ).rejects.toMatchObject({
      code: PROMOTION_ERROR_CODES.NOT_FOUND,
      status: 404,
    });
  });

  it("rejects duplicate active promotion codes within the same store", async () => {
    const module = createMemoryPromotionModule();
    const code = "DUPLICATE";

    await module.promotionService.createPromotion(
      validPromotionInput({ code, status: "active" }),
    );

    await expect(
      module.promotionService.createPromotion(
        validPromotionInput({ code, status: "active" }),
      ),
    ).rejects.toMatchObject({
      code: PROMOTION_ERROR_CODES.CODE_ALREADY_EXISTS,
      status: 409,
    });
  });

  it("allows code reuse after soft delete", async () => {
    const module = createMemoryPromotionModule();
    const code = "REUSE-ME";

    const first = await module.promotionService.createPromotion(
      validPromotionInput({ code, status: "active" }),
    );

    await module.promotionService.softDeletePromotion(
      TEST_STORE_A_ID,
      first.id,
    );

    const second = await module.promotionService.createPromotion(
      validPromotionInput({ code, status: "active" }),
    );

    expect(second.code).toBe(code);
    expect(second.id).not.toBe(first.id);
  });

  it("isolates promotions by store", async () => {
    const module = createMemoryPromotionModule();
    const created = await module.promotionService.createPromotion(
      validPromotionInput(),
    );

    await expect(
      module.promotionService.getPromotion(TEST_STORE_B_ID, created.id),
    ).rejects.toMatchObject({
      code: PROMOTION_ERROR_CODES.NOT_FOUND,
      status: 404,
    });
  });

  it("rejects invalid date ranges", async () => {
    const module = createMemoryPromotionModule();

    await expect(
      module.promotionService.createPromotion(
        validPromotionInput({
          startsAt: "2026-08-01T00:00:00.000Z",
          endsAt: "2026-07-01T00:00:00.000Z",
        }),
      ),
    ).rejects.toMatchObject({
      code: PROMOTION_ERROR_CODES.VALIDATION_ERROR,
      status: 400,
    });
  });

  it("rejects invalid percentage values", async () => {
    const module = createMemoryPromotionModule();

    await expect(
      module.promotionService.createPromotion(
        validPromotionInput({ value: "101" }),
      ),
    ).rejects.toMatchObject({
      code: PROMOTION_ERROR_CODES.VALIDATION_ERROR,
      status: 400,
    });
  });

  it("requires currency for fixed amount promotions", async () => {
    const module = createMemoryPromotionModule();

    await expect(
      module.promotionService.createPromotion(
        validPromotionInput({
          type: "fixed_amount",
          value: "10.00",
        }),
      ),
    ).rejects.toMatchObject({
      code: PROMOTION_ERROR_CODES.VALIDATION_ERROR,
      status: 400,
    });
  });

  it("accepts valid fixed amount promotions", async () => {
    const module = createMemoryPromotionModule();
    const created = await module.promotionService.createPromotion(
      validFixedAmountPromotionInput(),
    );

    expect(created.type).toBe("fixed_amount");
    expect(created.currency).toBe("USD");
  });

  it("rolls back when the transaction fails", async () => {
    const module = createMemoryPromotionModule();
    const created = await module.promotionService.createPromotion(
      validPromotionInput(),
    );

    module.promotionRepository.setTransactionFailure(new Error("db failure"));

    await expect(
      module.promotionService.updatePromotion(TEST_STORE_A_ID, created.id, {
        name: "Should fail",
      }),
    ).rejects.toMatchObject({
      code: PROMOTION_ERROR_CODES.TRANSACTION_FAILED,
      status: 500,
    });

    const unchanged = await module.promotionService.getPromotion(
      TEST_STORE_A_ID,
      created.id,
    );
    expect(unchanged.name).toBe(created.name);
  });
});
