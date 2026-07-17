import type { UpdateStoreSettingsInput } from "@commerceflow/validation";

import type { DomainEventPublisher } from "@/domain-events";
import { MemoryStoreAdministrationRepository } from "../repositories/memory-store-administration.repository";
import { StoreAdministrationService } from "../services/store-administration.service";

export const TEST_ORGANIZATION_A_ID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
export const TEST_ORGANIZATION_B_ID = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
export const TEST_STORE_A_ID = "11111111-1111-1111-1111-111111111111";
export const TEST_STORE_B_ID = "22222222-2222-2222-2222-222222222222";

export function createMemoryStoreAdministrationModule(options: {
  domainEventPublisher?: DomainEventPublisher;
} = {}) {
  const storeAdministrationRepository =
    new MemoryStoreAdministrationRepository();

  return {
    storeAdministrationRepository,
    storeAdministrationService: new StoreAdministrationService({
      storeAdministrationRepository,
      domainEventPublisher: options.domainEventPublisher,
    }),
  };
}

export function seedStore(
  repository: MemoryStoreAdministrationRepository,
  input: {
    id?: string;
    organizationId?: string;
    name?: string;
    slug?: string;
    defaultCurrency?: string;
    defaultTimezone?: string;
    locale?: string;
  } = {},
) {
  return repository.seedStore({
    id: input.id ?? TEST_STORE_A_ID,
    organizationId: input.organizationId ?? TEST_ORGANIZATION_A_ID,
    name: input.name ?? "Main Store",
    slug: input.slug ?? "main-store",
    settings: {
      defaultCurrency: input.defaultCurrency ?? "USD",
      defaultTimezone: input.defaultTimezone ?? "UTC",
      locale: input.locale ?? "en-US",
    },
  });
}

export function validUpdateStoreSettingsInput(
  overrides: Partial<UpdateStoreSettingsInput> = {},
): UpdateStoreSettingsInput {
  return {
    defaultCurrency: "EUR",
    ...overrides,
  };
}
