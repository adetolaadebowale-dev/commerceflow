import type { CreatePromotionInput } from "@commerceflow/validation";

import { MemoryPromotionRepository } from "../repositories/memory-promotion.repository";
import { PromotionService } from "../services/promotion.service";
import type { DomainEventPublisher } from "@/domain-events";

export const TEST_STORE_A_ID = "11111111-1111-1111-1111-111111111111";
export const TEST_STORE_B_ID = "22222222-2222-2222-2222-222222222222";

export function createMemoryPromotionModule(options: {
  domainEventPublisher?: DomainEventPublisher;
} = {}): {
  promotionService: PromotionService;
  promotionRepository: MemoryPromotionRepository;
} {
  const promotionRepository = new MemoryPromotionRepository();

  return {
    promotionRepository,
    promotionService: new PromotionService({
      promotionRepository,
      domainEventPublisher: options.domainEventPublisher,
    }),
  };
}

export function validPromotionInput(
  overrides: Partial<CreatePromotionInput> = {},
): CreatePromotionInput {
  const suffix = crypto.randomUUID().slice(0, 8);

  return {
    storeId: TEST_STORE_A_ID,
    name: "Summer Sale",
    code: `SUMMER-${suffix}`,
    description: "Summer discount",
    type: "percentage",
    value: "20",
    status: "draft",
    startsAt: "2026-07-01T00:00:00.000Z",
    endsAt: "2026-08-01T00:00:00.000Z",
    ...overrides,
  };
}

export function validFixedAmountPromotionInput(
  overrides: Partial<CreatePromotionInput> = {},
): CreatePromotionInput {
  return validPromotionInput({
    type: "fixed_amount",
    value: "10.00",
    currency: "USD",
    ...overrides,
  });
}
