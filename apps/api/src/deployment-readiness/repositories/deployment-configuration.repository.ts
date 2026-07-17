import type { DeploymentConfiguration } from "@commerceflow/types";
import type { UpdateDeploymentConfigurationInput } from "@commerceflow/validation";

export function defaultDeploymentConfiguration(
  now = new Date().toISOString(),
): DeploymentConfiguration {
  return {
    target: "staging",
    requireHttps: true,
    requireMigrationsApplied: true,
    minimumNodeVersion: "20",
    releaseChannel: "stable",
    notes: "Deployment execution is external to CommerceFlow",
    updatedAt: now,
  };
}

export interface DeploymentConfigurationRepository {
  getConfiguration(): Promise<DeploymentConfiguration>;
  updateConfiguration(
    input: Omit<UpdateDeploymentConfigurationInput, "storeId">,
  ): Promise<DeploymentConfiguration>;
}
