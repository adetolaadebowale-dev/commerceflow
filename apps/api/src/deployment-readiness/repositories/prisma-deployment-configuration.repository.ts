import {
  Prisma,
  type PlatformConfiguration as PrismaPlatformConfiguration,
  type PrismaClient,
} from "@prisma/client";
import type {
  DeploymentConfiguration,
  DeploymentTarget,
} from "@commerceflow/types";
import type { UpdateDeploymentConfigurationInput } from "@commerceflow/validation";

import {
  defaultDeploymentConfiguration,
  type DeploymentConfigurationRepository,
} from "./deployment-configuration.repository";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseConfiguration(
  value: Prisma.JsonValue,
): DeploymentConfiguration {
  if (!isRecord(value) || Object.keys(value).length === 0) {
    return defaultDeploymentConfiguration();
  }

  const target = value.target;
  const resolvedTarget: DeploymentTarget =
    target === "development" ||
    target === "staging" ||
    target === "production"
      ? target
      : "staging";

  return {
    target: resolvedTarget,
    requireHttps:
      typeof value.requireHttps === "boolean" ? value.requireHttps : true,
    requireMigrationsApplied:
      typeof value.requireMigrationsApplied === "boolean"
        ? value.requireMigrationsApplied
        : true,
    minimumNodeVersion:
      typeof value.minimumNodeVersion === "string"
        ? value.minimumNodeVersion
        : "20",
    releaseChannel:
      typeof value.releaseChannel === "string"
        ? value.releaseChannel
        : "stable",
    notes: typeof value.notes === "string" ? value.notes : undefined,
    updatedAt:
      typeof value.updatedAt === "string"
        ? value.updatedAt
        : new Date().toISOString(),
  };
}

function toJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

export class PrismaDeploymentConfigurationRepository
  implements DeploymentConfigurationRepository
{
  constructor(private readonly db: PrismaClient) {}

  async getConfiguration(): Promise<DeploymentConfiguration> {
    const configuration = await this.ensureConfiguration();
    return parseConfiguration(configuration.deploymentConfiguration);
  }

  async updateConfiguration(
    input: Omit<UpdateDeploymentConfigurationInput, "storeId">,
  ): Promise<DeploymentConfiguration> {
    const configuration = await this.ensureConfiguration();
    const current = parseConfiguration(configuration.deploymentConfiguration);
    const next: DeploymentConfiguration = {
      target: input.target,
      requireHttps: input.requireHttps,
      requireMigrationsApplied: input.requireMigrationsApplied,
      minimumNodeVersion: input.minimumNodeVersion,
      releaseChannel: input.releaseChannel,
      notes: input.notes ?? current.notes,
      updatedAt: new Date().toISOString(),
    };

    await this.db.platformConfiguration.update({
      where: { id: configuration.id },
      data: { deploymentConfiguration: toJson(next) },
    });

    return next;
  }

  private async ensureConfiguration(): Promise<PrismaPlatformConfiguration> {
    const existing = await this.db.platformConfiguration.findFirst({
      orderBy: { updatedAt: "desc" },
    });

    if (existing) {
      return existing;
    }

    return this.db.platformConfiguration.create({
      data: {
        maintenanceMode: false,
        deploymentConfiguration: toJson(defaultDeploymentConfiguration()),
      },
    });
  }
}
