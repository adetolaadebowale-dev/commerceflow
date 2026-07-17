import type { UpdateMaintenanceModeInput } from "@commerceflow/validation";

import type {
  PlatformConfigurationRecord,
  PlatformConfigurationRepository,
} from "./platform-configuration.repository";

export class MemoryPlatformConfigurationRepository
  implements PlatformConfigurationRepository
{
  private configuration: PlatformConfigurationRecord = {
    id: "00000000-0000-4000-8000-000000000001",
    maintenanceMode: false,
    maintenanceMessage: undefined,
    updatedAt: new Date(0).toISOString(),
  };
  private pingResult = true;

  setPingResult(result: boolean): void {
    this.pingResult = result;
  }

  seedConfiguration(
    overrides: Partial<PlatformConfigurationRecord> = {},
  ): void {
    this.configuration = {
      ...this.configuration,
      ...overrides,
      updatedAt: overrides.updatedAt ?? new Date().toISOString(),
    };
  }

  async getConfiguration(): Promise<PlatformConfigurationRecord> {
    return this.configuration;
  }

  async updateMaintenanceMode(
    input: Pick<
      UpdateMaintenanceModeInput,
      "maintenanceMode" | "maintenanceMessage"
    >,
  ): Promise<PlatformConfigurationRecord> {
    this.configuration = {
      ...this.configuration,
      maintenanceMode: input.maintenanceMode,
      maintenanceMessage:
        input.maintenanceMessage === null ||
        input.maintenanceMessage === undefined
          ? undefined
          : input.maintenanceMessage,
      updatedAt: new Date().toISOString(),
    };

    return this.configuration;
  }

  async ping(): Promise<boolean> {
    return this.pingResult;
  }
}
