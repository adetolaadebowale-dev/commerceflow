import { prisma } from "@/lib/prisma";

import type { PlatformConfigurationRepository } from "./platform-configuration.repository";
import { PrismaPlatformConfigurationRepository } from "./prisma-platform-configuration.repository";

let platformConfigurationRepository: PlatformConfigurationRepository | undefined;

export function getPlatformConfigurationRepository(): PlatformConfigurationRepository {
  if (!platformConfigurationRepository) {
    platformConfigurationRepository = new PrismaPlatformConfigurationRepository(
      prisma,
    );
  }

  return platformConfigurationRepository;
}

export { MemoryPlatformConfigurationRepository } from "./memory-platform-configuration.repository";
export type {
  PlatformConfigurationRecord,
  PlatformConfigurationRepository,
} from "./platform-configuration.repository";
export { PLATFORM_CONFIGURATION_SINGLETON_KEY } from "./platform-configuration.repository";
export { PrismaPlatformConfigurationRepository } from "./prisma-platform-configuration.repository";
