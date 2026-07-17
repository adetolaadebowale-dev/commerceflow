import { prisma } from "@/lib/prisma";

import type { LoadTestingConfigurationRepository } from "./load-testing-configuration.repository";
import { PrismaLoadTestingConfigurationRepository } from "./prisma-load-testing-configuration.repository";

let loadTestingConfigurationRepository:
  | LoadTestingConfigurationRepository
  | undefined;

export function getLoadTestingConfigurationRepository(): LoadTestingConfigurationRepository {
  if (!loadTestingConfigurationRepository) {
    loadTestingConfigurationRepository =
      new PrismaLoadTestingConfigurationRepository(prisma);
  }

  return loadTestingConfigurationRepository;
}

export {
  DEFAULT_ENDPOINT_BASELINES,
  defaultLoadTestingConfiguration,
  type LoadTestingConfigurationRepository,
} from "./load-testing-configuration.repository";
export { MemoryLoadTestingConfigurationRepository } from "./memory-load-testing-configuration.repository";
export { PrismaLoadTestingConfigurationRepository } from "./prisma-load-testing-configuration.repository";
