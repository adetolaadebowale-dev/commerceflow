import type {
  MaintenanceMode,
  PlatformDiagnostics,
  PlatformHealth,
  PlatformJobSummary,
  PlatformLiveness,
  PlatformReadiness,
  PlatformVersion,
} from "@commerceflow/types";
import type { UpdateMaintenanceModeInput } from "@commerceflow/validation";

import {
  DiagnosticsService,
  diagnosticsService,
} from "./diagnostics.service";
import {
  MaintenanceModeService,
  maintenanceModeService,
} from "./maintenance-mode.service";
import {
  PlatformHealthService,
  platformHealthService,
} from "./platform-health.service";

export interface PlatformOperationsServiceDependencies {
  readonly platformHealthService?: PlatformHealthService;
  readonly maintenanceModeService?: MaintenanceModeService;
  readonly diagnosticsService?: DiagnosticsService;
}

export class PlatformOperationsService {
  private readonly platformHealthService: PlatformHealthService;
  private readonly maintenanceModeService: MaintenanceModeService;
  private readonly diagnosticsService: DiagnosticsService;

  constructor(dependencies: PlatformOperationsServiceDependencies = {}) {
    this.platformHealthService =
      dependencies.platformHealthService ?? platformHealthService;
    this.maintenanceModeService =
      dependencies.maintenanceModeService ?? maintenanceModeService;
    this.diagnosticsService =
      dependencies.diagnosticsService ?? diagnosticsService;
  }

  getLiveness(): Promise<PlatformLiveness> {
    return this.platformHealthService.getLiveness();
  }

  getReadiness(): Promise<PlatformReadiness> {
    return this.platformHealthService.getReadiness();
  }

  getHealth(): Promise<PlatformHealth> {
    return this.platformHealthService.getHealth();
  }

  getVersion(): PlatformVersion {
    return this.diagnosticsService.getVersion();
  }

  getDiagnostics(storeId: string): Promise<PlatformDiagnostics> {
    return this.diagnosticsService.getDiagnostics(storeId);
  }

  getJobSummary(storeId: string): Promise<PlatformJobSummary> {
    return this.diagnosticsService.getJobSummary(storeId);
  }

  getMaintenanceMode(): Promise<MaintenanceMode> {
    return this.maintenanceModeService.getMaintenanceMode();
  }

  updateMaintenanceMode(
    input: UpdateMaintenanceModeInput,
  ): Promise<MaintenanceMode> {
    return this.maintenanceModeService.updateMaintenanceMode(input);
  }
}

export const platformOperationsService = new PlatformOperationsService();
