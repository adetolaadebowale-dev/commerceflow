import type { DomainEventPublisher } from "@/domain-events";
import { MemoryOrganizationRepository } from "../repositories/memory-organization.repository";
import { OrganizationService } from "../services/organization.service";

export const TEST_ORGANIZATION_A_ID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
export const TEST_ORGANIZATION_B_ID = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
export const TEST_STORE_A_ID = "11111111-1111-1111-1111-111111111111";
export const TEST_STORE_B_ID = "22222222-2222-2222-2222-222222222222";

export function createMemoryOrganizationModule(options: {
  domainEventPublisher?: DomainEventPublisher;
} = {}) {
  const organizationRepository = new MemoryOrganizationRepository();

  return {
    organizationRepository,
    organizationService: new OrganizationService({
      organizationRepository,
      domainEventPublisher: options.domainEventPublisher,
    }),
  };
}

export function seedOrganizationWithStore(
  repository: MemoryOrganizationRepository,
  input: {
    organizationId?: string;
    organizationName?: string;
    organizationSlug?: string;
    storeId?: string;
    storeName?: string;
    storeSlug?: string;
  } = {},
) {
  const organizationId = input.organizationId ?? TEST_ORGANIZATION_A_ID;
  const storeId = input.storeId ?? TEST_STORE_A_ID;
  const now = new Date().toISOString();

  const organization = repository.seedOrganization({
    id: organizationId,
    name: input.organizationName ?? "Acme Commerce",
    slug: input.organizationSlug ?? "acme-commerce",
    settings: {},
    createdAt: now,
    updatedAt: now,
  });

  const store = repository.seedStore({
    id: storeId,
    organizationId,
    name: input.storeName ?? "Main Store",
    slug: input.storeSlug ?? "main-store",
    createdAt: now,
    updatedAt: now,
  });

  return { organization, store };
}
