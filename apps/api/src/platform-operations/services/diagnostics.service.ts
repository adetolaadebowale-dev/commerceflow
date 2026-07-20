import type {
  ConfigurationValidationSummary,
  PlatformDiagnostics,
  PlatformJobSummary,
  PlatformVersion,
} from "@commerceflow/types";

import {
  getJobRepository,
  type JobRepository,
} from "@/jobs/repositories";
import {
  PlatformHealthService,
  platformHealthService,
} from "./platform-health.service";

export interface DiagnosticsServiceDependencies {
  readonly jobRepository?: JobRepository;
  readonly platformHealthService?: PlatformHealthService;
  readonly packageName?: string;
  readonly packageVersion?: string;
  readonly environment?: string;
  readonly nodeVersion?: string;
  readonly env?: NodeJS.ProcessEnv;
}

export class DiagnosticsService {
  private readonly jobRepository: JobRepository;
  private readonly platformHealthService: PlatformHealthService;
  private readonly packageName: string;
  private readonly packageVersion: string;
  private readonly environment: string;
  private readonly nodeVersion: string;
  private readonly env: NodeJS.ProcessEnv;

  constructor(dependencies: DiagnosticsServiceDependencies = {}) {
    this.jobRepository = dependencies.jobRepository ?? getJobRepository();
    this.platformHealthService =
      dependencies.platformHealthService ?? platformHealthService;
    this.packageName = dependencies.packageName ?? "api";
    this.packageVersion = dependencies.packageVersion ?? "0.1.0";
    this.environment =
      dependencies.environment ??
      dependencies.env?.NODE_ENV ??
      process.env.NODE_ENV ??
      "development";
    this.nodeVersion = dependencies.nodeVersion ?? process.version;
    this.env = dependencies.env ?? process.env;
  }

  getVersion(): PlatformVersion {
    return {
      name: this.packageName,
      version: this.packageVersion,
      environment: this.environment,
      nodeVersion: this.nodeVersion,
    };
  }

  validateConfiguration(): ConfigurationValidationSummary {
    const items = [
      this.validateEnv("DATABASE_URL"),
      this.validateEnv("AUTH_JWT_SECRET", { optionalInTest: true }),
    ];

    return {
      valid: items.every((item) => item.status === "ok"),
      items,
    };
  }

  async getJobSummary(storeId: string): Promise<PlatformJobSummary> {
    const summary = await this.jobRepository.summarizeForStore(storeId);

    return {
      storeId,
      total: summary.total,
      byStatus: summary.byStatus,
      oldestPendingScheduledFor: summary.oldestPendingScheduledFor,
    };
  }

  async getDiagnostics(storeId: string): Promise<PlatformDiagnostics> {
    const [health, jobs] = await Promise.all([
      this.platformHealthService.getHealth(),
      this.getJobSummary(storeId),
    ]);

    return {
      version: this.getVersion(),
      maintenance: health.maintenance,
      configuration: this.validateConfiguration(),
      jobs,
      health,
      checkedAt: new Date().toISOString(),
    };
  }

  private validateEnv(
    key: string,
    options: { optionalInTest?: boolean } = {},
  ) {
    const value = this.env[key];

    if (value && value.trim().length > 0) {
      return {
        key,
        status: "ok" as const,
        message: "Configured",
      };
    }

    if (options.optionalInTest && this.environment === "test") {
      return {
        key,
        status: "ok" as const,
        message: "Optional in test environment",
      };
    }

    return {
      key,
      status: "missing" as const,
      message: `${key} is not configured`,
    };
  }
}

export const diagnosticsService = new DiagnosticsService();
