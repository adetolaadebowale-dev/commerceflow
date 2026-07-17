import { prisma } from "@/lib/prisma";

import type { ApiKeyRepository } from "./api-key.repository";
import { PrismaApiKeyRepository } from "./prisma-api-key.repository";

let apiKeyRepository: ApiKeyRepository | undefined;

export function getApiKeyRepository(): ApiKeyRepository {
  if (!apiKeyRepository) {
    apiKeyRepository = new PrismaApiKeyRepository(prisma);
  }

  return apiKeyRepository;
}

export { MemoryApiKeyRepository } from "./memory-api-key.repository";
export type { ApiKeyRepository } from "./api-key.repository";
export { PrismaApiKeyRepository } from "./prisma-api-key.repository";
