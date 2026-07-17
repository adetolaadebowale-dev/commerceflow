import type { DomainEventPublisher } from "@/domain-events";
import { MemoryDeploymentConfigurationRepository } from "../repositories/memory-deployment-configuration.repository";
import { DeploymentReadinessService } from "../services/deployment-readiness.service";
import { EnvironmentDiagnosticsService } from "../services/environment-diagnostics.service";
import { ReleaseValidationService } from "../services/release-validation.service";

export const TEST_STORE_A_ID = "11111111-1111-1111-1111-111111111111";

export function createMemoryDeploymentReadinessModule(options: {
  domainEventPublisher?: DomainEventPublisher;
  env?: NodeJS.ProcessEnv;
  environment?: string;
  nodeVersion?: string;
  migrationsApplied?: boolean;
  now?: () => Date;
} = {}) {
  const configurationRepository = new MemoryDeploymentConfigurationRepository();
  const env: NodeJS.ProcessEnv = options.env ?? {
    NODE_ENV: "production",
    DATABASE_URL: "postgresql://localhost:5432/commerceflow",
    JWT_ACCESS_SECRET: "test-access-secret-value",
    JWT_REFRESH_SECRET: "test-refresh-secret-value",
    PUBLIC_API_URL: "https://api.example.com",
  };
  const environmentDiagnosticsService = new EnvironmentDiagnosticsService({
    configurationRepository,
    env,
    environment: options.environment ?? "staging",
    nodeVersion: options.nodeVersion ?? "v20.11.0",
    now: options.now,
  });
  const releaseValidationService = new ReleaseValidationService({
    configurationRepository,
    packageName: "api",
    packageVersion: "0.1.0",
    nodeVersion: options.nodeVersion ?? "v20.11.0",
    buildId: "build-test-1",
    now: options.now,
  });
  const deploymentReadinessService = new DeploymentReadinessService({
    configurationRepository,
    environmentDiagnosticsService,
    releaseValidationService,
    domainEventPublisher: options.domainEventPublisher,
    migrationsApplied: options.migrationsApplied ?? true,
    now: options.now,
  });

  return {
    configurationRepository,
    environmentDiagnosticsService,
    releaseValidationService,
    deploymentReadinessService,
  };
}
