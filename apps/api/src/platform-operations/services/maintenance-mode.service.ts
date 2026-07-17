import type { MaintenanceMode } from "@commerceflow/types";
import type { UpdateMaintenanceModeInput } from "@commerceflow/validation";

import {
  getDomainEventPublisher,
  type DomainEventPublisher,
} from "@/domain-events";
import {
  getPlatformConfigurationRepository,
  type PlatformConfigurationRecord,
  type PlatformConfigurationRepository,
} from "../repositories";

export interface MaintenanceModeServiceDependencies {
  readonly platformConfigurationRepository?: PlatformConfigurationRepository;
  readonly domainEventPublisher?: DomainEventPublisher;
}

export class MaintenanceModeService {
  private readonly platformConfigurationRepository: PlatformConfigurationRepository;
  private readonly domainEventPublisher: DomainEventPublisher;

  constructor(dependencies: MaintenanceModeServiceDependencies = {}) {
    this.platformConfigurationRepository =
      dependencies.platformConfigurationRepository ??
      getPlatformConfigurationRepository();
    this.domainEventPublisher =
      dependencies.domainEventPublisher ?? getDomainEventPublisher();
  }

  async getMaintenanceMode(): Promise<MaintenanceMode> {
    const configuration =
      await this.platformConfigurationRepository.getConfiguration();

    return this.toMaintenanceMode(configuration);
  }

  async updateMaintenanceMode(
    input: UpdateMaintenanceModeInput,
  ): Promise<MaintenanceMode> {
    const previous =
      await this.platformConfigurationRepository.getConfiguration();

    const updated =
      await this.platformConfigurationRepository.updateMaintenanceMode({
        maintenanceMode: input.maintenanceMode,
        maintenanceMessage: input.maintenanceMessage,
      });

    const maintenance = this.toMaintenanceMode(updated);

    if (updated.maintenanceMode && !previous.maintenanceMode) {
      this.domainEventPublisher.publishPlatformMaintenanceEnabled(
        maintenance,
        updated.id,
        input.storeId,
      );
    } else if (!updated.maintenanceMode && previous.maintenanceMode) {
      this.domainEventPublisher.publishPlatformMaintenanceDisabled(
        maintenance,
        updated.id,
        input.storeId,
      );
    }

    return maintenance;
  }

  private toMaintenanceMode(
    configuration: PlatformConfigurationRecord,
  ): MaintenanceMode {
    return {
      maintenanceMode: configuration.maintenanceMode,
      maintenanceMessage: configuration.maintenanceMessage,
      updatedAt: configuration.updatedAt,
    };
  }
}

export const maintenanceModeService = new MaintenanceModeService();
