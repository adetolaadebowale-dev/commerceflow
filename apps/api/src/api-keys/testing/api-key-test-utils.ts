import type { CreateApiKeyInput } from "@commerceflow/validation";

import type { DomainEventPublisher } from "@/domain-events";
import { MemoryApiKeyRepository } from "../repositories/memory-api-key.repository";
import { ApiKeyAuthenticationService } from "../services/api-key-authentication.service";
import { ApiKeyService } from "../services/api-key.service";

export const TEST_STORE_A_ID = "11111111-1111-1111-1111-111111111111";
export const TEST_STORE_B_ID = "22222222-2222-2222-2222-222222222222";

export function createMemoryApiKeyModule(options: {
  domainEventPublisher?: DomainEventPublisher;
} = {}) {
  const apiKeyRepository = new MemoryApiKeyRepository();

  return {
    apiKeyRepository,
    apiKeyService: new ApiKeyService({
      apiKeyRepository,
      domainEventPublisher: options.domainEventPublisher,
    }),
    apiKeyAuthenticationService: new ApiKeyAuthenticationService({
      apiKeyRepository,
    }),
  };
}

export function validCreateApiKeyInput(
  overrides: Partial<CreateApiKeyInput> = {},
): CreateApiKeyInput {
  return {
    storeId: TEST_STORE_A_ID,
    name: "Integration Key",
    permissions: ["catalogue:read", "orders:read"],
    ...overrides,
  };
}
