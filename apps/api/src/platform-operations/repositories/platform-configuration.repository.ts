import type { MaintenanceMode } from "@commerceflow/types";
import type { UpdateMaintenanceModeInput } from "@commerceflow/validation";

export const PLATFORM_CONFIGURATION_SINGLETON_KEY = "default";

export interface PlatformConfigurationRecord extends MaintenanceMode {
  readonly id: string;
}

export interface PlatformConfigurationRepository {
  getConfiguration(): Promise<PlatformConfigurationRecord>;
  updateMaintenanceMode(
    input: Pick<
      UpdateMaintenanceModeInput,
      "maintenanceMode" | "maintenanceMessage"
    >,
  ): Promise<PlatformConfigurationRecord>;
  ping(): Promise<boolean>;
}
