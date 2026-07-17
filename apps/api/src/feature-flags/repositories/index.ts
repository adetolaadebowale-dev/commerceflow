import { prisma } from "@/lib/prisma";

import type { FeatureFlagRepository } from "./feature-flag.repository";
import { PrismaFeatureFlagRepository } from "./prisma-feature-flag.repository";

let featureFlagRepository: FeatureFlagRepository | undefined;

export function getFeatureFlagRepository(): FeatureFlagRepository {
  if (!featureFlagRepository) {
    featureFlagRepository = new PrismaFeatureFlagRepository(prisma);
  }

  return featureFlagRepository;
}

export { MemoryFeatureFlagRepository } from "./memory-feature-flag.repository";
export type { FeatureFlagRepository, FeatureFlagStoreContext } from "./feature-flag.repository";
export {
  buildScopeIdentity,
  collectKnownKeys,
  resolveEffectiveFlag,
  resolveEffectiveFlags,
} from "./feature-flag.repository";
export { PrismaFeatureFlagRepository } from "./prisma-feature-flag.repository";
