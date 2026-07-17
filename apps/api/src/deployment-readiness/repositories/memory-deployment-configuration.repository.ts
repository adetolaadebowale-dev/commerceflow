import type { DeploymentConfiguration } from "@commerceflow/types";
import type { UpdateDeploymentConfigurationInput } from "@commerceflow/validation";

import {
  defaultDeploymentConfiguration,
  type DeploymentConfigurationRepository,
} from "./deployment-configuration.repository";

export class MemoryDeploymentConfigurationRepository
  implements DeploymentConfigurationRepository
{
  private configuration: DeploymentConfiguration =
    defaultDeploymentConfiguration(new Date(0).toISOString());

  seedConfiguration(configuration: DeploymentConfiguration): void {
    this.configuration = configuration;
  }

  async getConfiguration(): Promise<DeploymentConfiguration> {
    return this.configuration;
  }

  async updateConfiguration(
    input: Omit<UpdateDeploymentConfigurationInput, "storeId">,
  ): Promise<DeploymentConfiguration> {
    this.configuration = {
      target: input.target,
      requireHttps: input.requireHttps,
      requireMigrationsApplied: input.requireMigrationsApplied,
      minimumNodeVersion: input.minimumNodeVersion,
      releaseChannel: input.releaseChannel,
      notes: input.notes ?? this.configuration.notes,
      updatedAt: new Date().toISOString(),
    };
    return this.configuration;
  }
}
