import { describe, expect, it, vi } from "vitest";

import { createTestDomainEventPublisher } from "@/domain-events/testing/domain-events-test-utils";
import {
  createMemoryPromotionModule,
  TEST_STORE_A_ID,
  validPromotionInput,
} from "../testing/promotion-test-utils";

describe("PromotionService domain events", () => {
  it("emits promotion.created after successful creation", async () => {
    const { dispatcher, publisher } = createTestDomainEventPublisher();
    const handler = vi.fn();
    dispatcher.subscribe("promotion.created", handler);

    const module = createMemoryPromotionModule({ domainEventPublisher: publisher });
    const promotion = await module.promotionService.createPromotion(
      validPromotionInput(),
    );

    await vi.waitFor(() => {
      expect(handler).toHaveBeenCalledOnce();
    });

    expect(handler.mock.calls[0]?.[0]).toMatchObject({
      eventType: "promotion.created",
      aggregateId: promotion.id,
      storeId: TEST_STORE_A_ID,
      payload: {
        promotionId: promotion.id,
        code: promotion.code,
      },
    });
  });

  it("emits promotion.updated after successful update", async () => {
    const { dispatcher, publisher } = createTestDomainEventPublisher();
    const handler = vi.fn();
    dispatcher.subscribe("promotion.updated", handler);

    const module = createMemoryPromotionModule({ domainEventPublisher: publisher });
    const promotion = await module.promotionService.createPromotion(
      validPromotionInput(),
    );

    await module.promotionService.updatePromotion(
      TEST_STORE_A_ID,
      promotion.id,
      { name: "Updated" },
    );

    await vi.waitFor(() => {
      expect(handler).toHaveBeenCalledOnce();
    });

    expect(handler.mock.calls[0]?.[0].eventType).toBe("promotion.updated");
  });

  it("emits promotion.deleted after soft delete", async () => {
    const { dispatcher, publisher } = createTestDomainEventPublisher();
    const handler = vi.fn();
    dispatcher.subscribe("promotion.deleted", handler);

    const module = createMemoryPromotionModule({ domainEventPublisher: publisher });
    const promotion = await module.promotionService.createPromotion(
      validPromotionInput(),
    );

    await module.promotionService.softDeletePromotion(
      TEST_STORE_A_ID,
      promotion.id,
    );

    await vi.waitFor(() => {
      expect(handler).toHaveBeenCalledOnce();
    });

    expect(handler.mock.calls[0]?.[0].eventType).toBe("promotion.deleted");
  });

  it("does not emit events when creation fails", async () => {
    const { dispatcher, publisher } = createTestDomainEventPublisher();
    const handler = vi.fn();
    dispatcher.subscribe("promotion.created", handler);

    const module = createMemoryPromotionModule({ domainEventPublisher: publisher });
    const input = validPromotionInput({ code: "DUPE", status: "active" });

    await module.promotionService.createPromotion(input);

    await expect(
      module.promotionService.createPromotion(input),
    ).rejects.toMatchObject({ status: 409 });

    expect(handler).toHaveBeenCalledOnce();
  });
});
