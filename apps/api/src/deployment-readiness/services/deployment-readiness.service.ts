import type {
  DeploymentChecklistItem,
  DeploymentConfiguration,
  DeploymentReadiness,
  DeploymentReadinessStatus,
  EnvironmentDiagnostics,
  ReleaseMetadata,
  VersionCompatibilityDiagnostics,
} from "@commerceflow/types";
import type { UpdateDeploymentConfigurationInput } from "@commerceflow/validation";

import {
  getDomainEventPublisher,
  type DomainEventPublisher,
} from "@/domain-events";
import {
  getDeploymentConfigurationRepository,
  type DeploymentConfigurationRepository,
} from "../repositories";
import {
  EnvironmentDiagnosticsService,
  environmentDiagnosticsService,
} from "./environment-diagnostics.service";
import {
  ReleaseValidationService,
  releaseValidationService,
} from "./release-validation.service";

export const DEFAULT_DEPLOYMENT_CHECKLIST: readonly Omit<
  DeploymentChecklistItem,
  "completed"
>[] = [
  {
    id: "verify-required-secrets",
    title: "Verify required secrets",
    description: "Confirm DATABASE_URL and JWT secrets are configured",
    category: "configuration",
    required: true,
  },
  {
    id: "apply-migrations",
    title: "Apply database migrations",
    description: "Ensure Prisma migrations are applied before release",
    category: "database",
    required: true,
  },
  {
    id: "confirm-https",
    title: "Confirm HTTPS endpoints",
    description: "Validate public API URL uses HTTPS for staging/production",
    category: "security",
    required: true,
  },
  {
    id: "review-release-notes",
    title: "Review release notes",
    description: "Confirm release channel and version metadata before deploy",
    category: "release",
    required: true,
  },
  {
    id: "validate-health-probes",
    title: "Validate health probes",
    description: "Check /api/platform/live and /api/platform/ready responses",
    category: "operations",
    required: true,
  },
];

export interface DeploymentReadinessServiceDependencies {
  readonly configurationRepository?: DeploymentConfigurationRepository;
  readonly environmentDiagnosticsService?: EnvironmentDiagnosticsService;
  readonly releaseValidationService?: ReleaseValidationService;
  readonly domainEventPublisher?: DomainEventPublisher;
  readonly migrationsApplied?: boolean;
  readonly now?: () => Date;
}

export class DeploymentReadinessService {
  private readonly configurationRepository: DeploymentConfigurationRepository;
  private readonly environmentDiagnosticsService: EnvironmentDiagnosticsService;
  private readonly releaseValidationService: ReleaseValidationService;
  private readonly domainEventPublisher: DomainEventPublisher;
  private readonly migrationsApplied: boolean;
  private readonly now: () => Date;

  constructor(dependencies: DeploymentReadinessServiceDependencies = {}) {
    this.configurationRepository =
      dependencies.configurationRepository ??
      getDeploymentConfigurationRepository();
    this.environmentDiagnosticsService =
      dependencies.environmentDiagnosticsService ??
      environmentDiagnosticsService;
    this.releaseValidationService =
      dependencies.releaseValidationService ?? releaseValidationService;
    this.domainEventPublisher =
      dependencies.domainEventPublisher ?? getDomainEventPublisher();
    this.migrationsApplied = dependencies.migrationsApplied ?? true;
    this.now = dependencies.now ?? (() => new Date());
  }

  async getEnvironmentDiagnostics(): Promise<EnvironmentDiagnostics> {
    return this.environmentDiagnosticsService.getDiagnostics();
  }

  async getReleaseMetadata(): Promise<ReleaseMetadata> {
    return this.releaseValidationService.getReleaseMetadata();
  }

  async getChecklist(): Promise<readonly DeploymentChecklistItem[]> {
    const readiness = await this.getReadiness();
    return readiness.checklist;
  }

  async getReadiness(): Promise<DeploymentReadiness> {
    const configuration = await this.configurationRepository.getConfiguration();
    const [environment, release, versionCompatibility] = await Promise.all([
      this.environmentDiagnosticsService.getDiagnostics(configuration),
      this.releaseValidationService.getReleaseMetadata(configuration),
      this.releaseValidationService.getVersionCompatibility(configuration),
    ]);
    const checklist = this.buildChecklist(
      configuration,
      environment,
      versionCompatibility,
    );

    return {
      status: this.deriveStatus(
        environment,
        versionCompatibility,
        checklist,
        configuration,
      ),
      configuration,
      environment,
      release,
      versionCompatibility,
      checklist,
      checkedAt: this.now().toISOString(),
    };
  }

  async updateConfiguration(
    input: UpdateDeploymentConfigurationInput,
  ): Promise<DeploymentConfiguration> {
    const configuration = await this.configurationRepository.updateConfiguration(
      {
        target: input.target,
        requireHttps: input.requireHttps,
        requireMigrationsApplied: input.requireMigrationsApplied,
        minimumNodeVersion: input.minimumNodeVersion,
        releaseChannel: input.releaseChannel,
        notes: input.notes,
      },
    );

    this.domainEventPublisher.publishPlatformDeploymentConfigurationUpdated(
      configuration,
      input.storeId,
    );

    return configuration;
  }

  private buildChecklist(
    configuration: DeploymentConfiguration,
    environment: EnvironmentDiagnostics,
    versionCompatibility: VersionCompatibilityDiagnostics,
  ): DeploymentChecklistItem[] {
    const secretsOk = environment.checks
      .filter((check) => check.key !== "PUBLIC_HTTPS" && check.key !== "NODE_VERSION")
      .filter((check) => check.required)
      .every((check) => check.status === "pass");
    const httpsOk =
      environment.checks.find((check) => check.key === "PUBLIC_HTTPS")
        ?.status === "pass";
    const migrationsOk =
      !configuration.requireMigrationsApplied || this.migrationsApplied;

    return DEFAULT_DEPLOYMENT_CHECKLIST.map((item) => {
      switch (item.id) {
        case "verify-required-secrets":
          return { ...item, completed: secretsOk };
        case "apply-migrations":
          return { ...item, completed: migrationsOk };
        case "confirm-https":
          return {
            ...item,
            completed: httpsOk,
            required:
              configuration.requireHttps &&
              configuration.target !== "development",
          };
        case "review-release-notes":
          return {
            ...item,
            completed:
              configuration.releaseChannel.length > 0 &&
              versionCompatibility.compatible,
          };
        case "validate-health-probes":
          return { ...item, completed: environment.valid };
        default:
          return { ...item, completed: false };
      }
    });
  }

  private deriveStatus(
    environment: EnvironmentDiagnostics,
    versionCompatibility: VersionCompatibilityDiagnostics,
    checklist: readonly DeploymentChecklistItem[],
    configuration: DeploymentConfiguration,
  ): DeploymentReadinessStatus {
    const requiredIncomplete = checklist.some(
      (item) => item.required && !item.completed,
    );

    if (
      !environment.valid ||
      !versionCompatibility.compatible ||
      (configuration.requireMigrationsApplied && !this.migrationsApplied)
    ) {
      return "blocked";
    }

    if (requiredIncomplete) {
      return "needs_attention";
    }

    return "ready";
  }
}

export const deploymentReadinessService = new DeploymentReadinessService();
