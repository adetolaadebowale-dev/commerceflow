import type {
  PlatformConfiguration as PrismaPlatformConfiguration,
  PrismaClient,
} from "@prisma/client";
import type { UpdateMaintenanceModeInput } from "@commerceflow/validation";

import type {
  PlatformConfigurationRecord,
  PlatformConfigurationRepository,
} from "./platform-configuration.repository";

function toConfiguration(
  record: PrismaPlatformConfiguration,
): PlatformConfigurationRecord {
  return {
    id: record.id,
    maintenanceMode: record.maintenanceMode,
    maintenanceMessage: record.maintenanceMessage ?? undefined,
    updatedAt: record.updatedAt.toISOString(),
  };
}

export class PrismaPlatformConfigurationRepository
  implements PlatformConfigurationRepository
{
  constructor(private readonly db: PrismaClient) {}

  async getConfiguration(): Promise<PlatformConfigurationRecord> {
    const existing = await this.db.platformConfiguration.findFirst({
      orderBy: { updatedAt: "desc" },
    });

    if (existing) {
      return toConfiguration(existing);
    }

    const created = await this.db.platformConfiguration.create({
      data: {
        maintenanceMode: false,
      },
    });

    return toConfiguration(created);
  }

  async updateMaintenanceMode(
    input: Pick<
      UpdateMaintenanceModeInput,
      "maintenanceMode" | "maintenanceMessage"
    >,
  ): Promise<PlatformConfigurationRecord> {
    const current = await this.getConfiguration();

    const updated = await this.db.platformConfiguration.update({
      where: { id: current.id },
      data: {
        maintenanceMode: input.maintenanceMode,
        maintenanceMessage:
          input.maintenanceMessage === undefined
            ? undefined
            : input.maintenanceMessage,
      },
    });

    return toConfiguration(updated);
  }

  async ping(): Promise<boolean> {
    try {
      await this.db.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }
}
