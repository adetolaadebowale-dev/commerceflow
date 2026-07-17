import {
  Prisma,
  type PlatformConfiguration as PrismaPlatformConfiguration,
  type PrismaClient,
} from "@prisma/client";
import type {
  LoadTestingConfiguration,
  LoadTestTool,
} from "@commerceflow/types";
import type { UpdateLoadTestingConfigurationInput } from "@commerceflow/validation";

import {
  defaultLoadTestingConfiguration,
  type LoadTestingConfigurationRepository,
} from "./load-testing-configuration.repository";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseConfiguration(value: Prisma.JsonValue): LoadTestingConfiguration {
  if (!isRecord(value) || Object.keys(value).length === 0) {
    return defaultLoadTestingConfiguration();
  }

  const preferredTool = value.preferredTool;
  const tool: LoadTestTool =
    preferredTool === "manual" ||
    preferredTool === "k6" ||
    preferredTool === "jmeter" ||
    preferredTool === "gatling"
      ? preferredTool
      : "manual";

  return {
    enabled: typeof value.enabled === "boolean" ? value.enabled : false,
    preferredTool: tool,
    targetVirtualUsers:
      typeof value.targetVirtualUsers === "number"
        ? value.targetVirtualUsers
        : 50,
    durationSeconds:
      typeof value.durationSeconds === "number" ? value.durationSeconds : 300,
    rampUpSeconds:
      typeof value.rampUpSeconds === "number" ? value.rampUpSeconds : 60,
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

export class PrismaLoadTestingConfigurationRepository
  implements LoadTestingConfigurationRepository
{
  constructor(private readonly db: PrismaClient) {}

  async getConfiguration(): Promise<LoadTestingConfiguration> {
    const configuration = await this.ensureConfiguration();
    return parseConfiguration(configuration.loadTestingConfiguration);
  }

  async updateConfiguration(
    input: Omit<UpdateLoadTestingConfigurationInput, "storeId">,
  ): Promise<LoadTestingConfiguration> {
    const configuration = await this.ensureConfiguration();
    const current = parseConfiguration(configuration.loadTestingConfiguration);
    const next: LoadTestingConfiguration = {
      enabled: input.enabled,
      preferredTool: input.preferredTool,
      targetVirtualUsers: input.targetVirtualUsers,
      durationSeconds: input.durationSeconds,
      rampUpSeconds: input.rampUpSeconds,
      notes: input.notes ?? current.notes,
      updatedAt: new Date().toISOString(),
    };

    await this.db.platformConfiguration.update({
      where: { id: configuration.id },
      data: { loadTestingConfiguration: toJson(next) },
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
        loadTestingConfiguration: toJson(defaultLoadTestingConfiguration()),
      },
    });
  }
}
