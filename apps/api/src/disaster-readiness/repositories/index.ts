import { prisma } from "@/lib/prisma";

import type { DisasterReadinessConfigurationRepository } from "./disaster-readiness-configuration.repository";
import { PrismaDisasterReadinessConfigurationRepository } from "./prisma-disaster-readiness-configuration.repository";

let disasterReadinessConfigurationRepository:
  | DisasterReadinessConfigurationRepository
  | undefined;

export function getDisasterReadinessConfigurationRepository(): DisasterReadinessConfigurationRepository {
  if (!disasterReadinessConfigurationRepository) {
    disasterReadinessConfigurationRepository =
      new PrismaDisasterReadinessConfigurationRepository(prisma);
  }

  return disasterReadinessConfigurationRepository;
}

export {
  DEFAULT_BACKUP_CONFIGURATION,
  defaultRecoveryObjectives,
  type DisasterReadinessConfigurationRepository,
} from "./disaster-readiness-configuration.repository";
export { MemoryDisasterReadinessConfigurationRepository } from "./memory-disaster-readiness-configuration.repository";
export { PrismaDisasterReadinessConfigurationRepository } from "./prisma-disaster-readiness-configuration.repository";
