import type {
  MaintenanceMode,
  PlatformHealth,
  PlatformHealthCheck,
  PlatformHealthStatus,
  PlatformLiveness,
  PlatformReadiness,
} from "@commerceflow/types";

import {
  getPlatformConfigurationRepository,
  type PlatformConfigurationRepository,
} from "../repositories";

export interface PlatformHealthServiceDependencies {
  readonly platformConfigurationRepository?: PlatformConfigurationRepository;
}

function deriveStatus(
  checks: readonly PlatformHealthCheck[],
): PlatformHealthStatus {
  if (checks.some((check) => check.status === "fail")) {
    return "unhealthy";
  }

  if (checks.some((check) => check.status === "warn")) {
    return "degraded";
  }

  return "healthy";
}

export class PlatformHealthService {
  private readonly platformConfigurationRepository: PlatformConfigurationRepository;

  constructor(dependencies: PlatformHealthServiceDependencies = {}) {
    this.platformConfigurationRepository =
      dependencies.platformConfigurationRepository ??
      getPlatformConfigurationRepository();
  }

  async getLiveness(): Promise<PlatformLiveness> {
    return {
      live: true,
      checkedAt: new Date().toISOString(),
    };
  }

  async getReadiness(): Promise<PlatformReadiness> {
    const databaseOk = await this.platformConfigurationRepository.ping();
    const checks: PlatformHealthCheck[] = [
      {
        name: "database",
        status: databaseOk ? "pass" : "fail",
        message: databaseOk
          ? "Database connection is available"
          : "Database connection failed",
      },
    ];

    return {
      ready: databaseOk,
      checks,
      checkedAt: new Date().toISOString(),
    };
  }

  async getHealth(): Promise<PlatformHealth> {
    const [maintenance, readiness] = await Promise.all([
      this.getMaintenanceMode(),
      this.getReadiness(),
    ]);

    const checks: PlatformHealthCheck[] = [...readiness.checks];

    if (maintenance.maintenanceMode) {
      checks.push({
        name: "maintenance",
        status: "warn",
        message:
          maintenance.maintenanceMessage ?? "Maintenance mode is enabled",
      });
    } else {
      checks.push({
        name: "maintenance",
        status: "pass",
        message: "Maintenance mode is disabled",
      });
    }

    return {
      status: deriveStatus(checks),
      checks,
      maintenance,
      checkedAt: new Date().toISOString(),
    };
  }

  async getMaintenanceMode(): Promise<MaintenanceMode> {
    const configuration =
      await this.platformConfigurationRepository.getConfiguration();

    return {
      maintenanceMode: configuration.maintenanceMode,
      maintenanceMessage: configuration.maintenanceMessage,
      updatedAt: configuration.updatedAt,
    };
  }
}

export const platformHealthService = new PlatformHealthService();
