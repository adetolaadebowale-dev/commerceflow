import type { DomainEventPublisher } from "@/domain-events";
import { MemoryJobRepository } from "@/jobs/repositories/memory-job.repository";
import { MemoryPlatformConfigurationRepository } from "../repositories/memory-platform-configuration.repository";
import { DiagnosticsService } from "../services/diagnostics.service";
import { MaintenanceModeService } from "../services/maintenance-mode.service";
import { PlatformHealthService } from "../services/platform-health.service";
import { PlatformOperationsService } from "../services/platform-operations.service";

export const TEST_STORE_A_ID = "11111111-1111-1111-1111-111111111111";
export const TEST_STORE_B_ID = "22222222-2222-2222-2222-222222222222";

export function createMemoryPlatformOperationsModule(options: {
  domainEventPublisher?: DomainEventPublisher;
  env?: NodeJS.ProcessEnv;
} = {}) {
  const platformConfigurationRepository =
    new MemoryPlatformConfigurationRepository();
  const jobRepository = new MemoryJobRepository();

  const platformHealthService = new PlatformHealthService({
    platformConfigurationRepository,
  });
  const maintenanceModeService = new MaintenanceModeService({
    platformConfigurationRepository,
    domainEventPublisher: options.domainEventPublisher,
  });
  const diagnosticsService = new DiagnosticsService({
    jobRepository,
    platformHealthService,
    packageName: "api",
    packageVersion: "0.1.0",
    environment: "test",
    nodeVersion: "v20.0.0",
    env: options.env ?? {
      NODE_ENV: "test",
      DATABASE_URL: "postgresql://localhost:5432/commerceflow",
      JWT_ACCESS_SECRET: "test-access",
      JWT_REFRESH_SECRET: "test-refresh",
    },
  });

  return {
    platformConfigurationRepository,
    jobRepository,
    platformHealthService,
    maintenanceModeService,
    diagnosticsService,
    platformOperationsService: new PlatformOperationsService({
      platformHealthService,
      maintenanceModeService,
      diagnosticsService,
    }),
  };
}
