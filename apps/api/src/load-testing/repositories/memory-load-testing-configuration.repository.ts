import type { LoadTestingConfiguration } from "@commerceflow/types";
import type { UpdateLoadTestingConfigurationInput } from "@commerceflow/validation";

import {
  defaultLoadTestingConfiguration,
  type LoadTestingConfigurationRepository,
} from "./load-testing-configuration.repository";

export class MemoryLoadTestingConfigurationRepository
  implements LoadTestingConfigurationRepository
{
  private configuration: LoadTestingConfiguration =
    defaultLoadTestingConfiguration(new Date(0).toISOString());

  seedConfiguration(configuration: LoadTestingConfiguration): void {
    this.configuration = configuration;
  }

  async getConfiguration(): Promise<LoadTestingConfiguration> {
    return this.configuration;
  }

  async updateConfiguration(
    input: Omit<UpdateLoadTestingConfigurationInput, "storeId">,
  ): Promise<LoadTestingConfiguration> {
    this.configuration = {
      enabled: input.enabled,
      preferredTool: input.preferredTool,
      targetVirtualUsers: input.targetVirtualUsers,
      durationSeconds: input.durationSeconds,
      rampUpSeconds: input.rampUpSeconds,
      notes: input.notes ?? this.configuration.notes,
      updatedAt: new Date().toISOString(),
    };
    return this.configuration;
  }
}
