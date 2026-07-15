import { describe, expect, it, vi } from "vitest";

import { createTestDomainEventPublisher } from "@/domain-events/testing/domain-events-test-utils";
import {
  createMemoryPromotionRedemptionModule,
  seedCartWithItem,
  TEST_STORE_A_ID,
  validActivePromotionInput,
} from "../testing/promotion-redemption-test-utils";

describe("PromotionRedemptionService domain events", () => {
  it("emits promotion.applied after successful apply", async () => {
    const { dispatcher, publisher } = createTestDomainEventPublisher();
    const handler = vi.fn();
    dispatcher.subscribe("promotion.applied", handler);

    const module = createMemoryPromotionRedemptionModule({
      domainEventPublisher: publisher,
    });
    const { cart } = await seedCartWithItem(module);
    await module.promotionRepository.create(
      validActivePromotionInput({ code: "EVENT" }),
    );

    await module.promotionRedemptionService.applyPromotion(
      TEST_STORE_A_ID,
      cart.id,
      { code: "EVENT" },
    );

    await vi.waitFor(() => {
      expect(handler).toHaveBeenCalledOnce();
    });

    expect(handler.mock.calls[0]?.[0].eventType).toBe("promotion.applied");
  });

  it("emits promotion.removed after successful remove", async () => {
    const { dispatcher, publisher } = createTestDomainEventPublisher();
    const handler = vi.fn();
    dispatcher.subscribe("promotion.removed", handler);

    const module = createMemoryPromotionRedemptionModule({
      domainEventPublisher: publisher,
    });
    const { cart } = await seedCartWithItem(module);
    await module.promotionRepository.create(
      validActivePromotionInput({ code: "REMOVE-EVENT" }),
    );
    await module.promotionRedemptionService.applyPromotion(
      TEST_STORE_A_ID,
      cart.id,
      { code: "REMOVE-EVENT" },
    );

    await module.promotionRedemptionService.removePromotion(
      TEST_STORE_A_ID,
      cart.id,
    );

    await vi.waitFor(() => {
      expect(handler).toHaveBeenCalledOnce();
    });

    expect(handler.mock.calls[0]?.[0].eventType).toBe("promotion.removed");
  });
});
