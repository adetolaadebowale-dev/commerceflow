import { prisma } from "@/lib/prisma";

import type { CachePolicyRepository } from "./cache-policy.repository";
import { PrismaCachePolicyRepository } from "./prisma-cache-policy.repository";

let cachePolicyRepository: CachePolicyRepository | undefined;

export function getCachePolicyRepository(): CachePolicyRepository {
  if (!cachePolicyRepository) {
    cachePolicyRepository = new PrismaCachePolicyRepository(prisma);
  }

  return cachePolicyRepository;
}

export {
  DEFAULT_CACHE_POLICIES,
  type CachePolicyRepository,
} from "./cache-policy.repository";
export { MemoryCachePolicyRepository } from "./memory-cache-policy.repository";
export { PrismaCachePolicyRepository } from "./prisma-cache-policy.repository";
