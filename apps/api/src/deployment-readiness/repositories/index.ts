import { prisma } from "@/lib/prisma";

import type { DeploymentConfigurationRepository } from "./deployment-configuration.repository";
import { PrismaDeploymentConfigurationRepository } from "./prisma-deployment-configuration.repository";

let deploymentConfigurationRepository:
  | DeploymentConfigurationRepository
  | undefined;

export function getDeploymentConfigurationRepository(): DeploymentConfigurationRepository {
  if (!deploymentConfigurationRepository) {
    deploymentConfigurationRepository =
      new PrismaDeploymentConfigurationRepository(prisma);
  }

  return deploymentConfigurationRepository;
}

export {
  defaultDeploymentConfiguration,
  type DeploymentConfigurationRepository,
} from "./deployment-configuration.repository";
export { MemoryDeploymentConfigurationRepository } from "./memory-deployment-configuration.repository";
export { PrismaDeploymentConfigurationRepository } from "./prisma-deployment-configuration.repository";
