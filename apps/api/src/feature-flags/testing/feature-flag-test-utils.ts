import type { UpsertFeatureFlagInput } from "@commerceflow/validation";

import type { DomainEventPublisher } from "@/domain-events";
import { MemoryFeatureFlagRepository } from "../repositories/memory-feature-flag.repository";
import { FeatureFlagService } from "../services/feature-flag.service";

export const TEST_ORG_A_ID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
export const TEST_ORG_B_ID = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
export const TEST_STORE_A_ID = "11111111-1111-1111-1111-111111111111";
export const TEST_STORE_A2_ID = "33333333-3333-3333-3333-333333333333";
export const TEST_STORE_B_ID = "22222222-2222-2222-2222-222222222222";

export function createMemoryFeatureFlagModule(options: {
  domainEventPublisher?: DomainEventPublisher;
} = {}) {
  const featureFlagRepository = new MemoryFeatureFlagRepository();

  featureFlagRepository.seedStore({
    storeId: TEST_STORE_A_ID,
    organizationId: TEST_ORG_A_ID,
  });
  featureFlagRepository.seedStore({
    storeId: TEST_STORE_A2_ID,
    organizationId: TEST_ORG_A_ID,
  });
  featureFlagRepository.seedStore({
    storeId: TEST_STORE_B_ID,
    organizationId: TEST_ORG_B_ID,
  });

  return {
    featureFlagRepository,
    featureFlagService: new FeatureFlagService({
      featureFlagRepository,
      domainEventPublisher: options.domainEventPublisher,
    }),
  };
}

export function validUpsertInput(
  overrides: Partial<UpsertFeatureFlagInput> = {},
): UpsertFeatureFlagInput {
  return {
    storeId: TEST_STORE_A_ID,
    scope: "store",
    enabled: true,
    description: "Test feature flag",
    ...overrides,
  };
}
