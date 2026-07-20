import type {
  DeploymentConfiguration,
  EnvironmentCheck,
  EnvironmentDiagnostics,
} from "@commerceflow/types";

import {
  getDeploymentConfigurationRepository,
  type DeploymentConfigurationRepository,
} from "../repositories";

export interface EnvironmentDiagnosticsServiceDependencies {
  readonly configurationRepository?: DeploymentConfigurationRepository;
  readonly env?: NodeJS.ProcessEnv;
  readonly environment?: string;
  readonly nodeVersion?: string;
  readonly now?: () => Date;
}

export class EnvironmentDiagnosticsService {
  private readonly configurationRepository: DeploymentConfigurationRepository;
  private readonly env: NodeJS.ProcessEnv;
  private readonly environment: string;
  private readonly nodeVersion: string;
  private readonly now: () => Date;

  constructor(dependencies: EnvironmentDiagnosticsServiceDependencies = {}) {
    this.configurationRepository =
      dependencies.configurationRepository ??
      getDeploymentConfigurationRepository();
    this.env = dependencies.env ?? process.env;
    this.environment =
      dependencies.environment ??
      dependencies.env?.NODE_ENV ??
      process.env.NODE_ENV ??
      "development";
    this.nodeVersion = dependencies.nodeVersion ?? process.version;
    this.now = dependencies.now ?? (() => new Date());
  }

  async getDiagnostics(
    configuration?: DeploymentConfiguration,
  ): Promise<EnvironmentDiagnostics> {
    const resolvedConfiguration =
      configuration ?? (await this.configurationRepository.getConfiguration());
    const checks = this.buildChecks(resolvedConfiguration);

    return {
      environment: this.environment,
      nodeVersion: this.nodeVersion,
      checks,
      valid: checks
        .filter((check) => check.required)
        .every((check) => check.status === "pass"),
      checkedAt: this.now().toISOString(),
    };
  }

  private buildChecks(
    configuration: DeploymentConfiguration,
  ): EnvironmentCheck[] {
    return [
      this.checkEnv("DATABASE_URL", true),
      this.checkEnv("AUTH_JWT_SECRET", this.environment !== "test"),
      this.checkHttps(configuration),
      this.checkNodeVersion(configuration.minimumNodeVersion),
    ];
  }

  private checkEnv(key: string, required: boolean): EnvironmentCheck {
    const value = this.env[key];
    if (value && value.trim().length > 0) {
      return {
        key,
        status: "pass",
        message: `${key} is configured`,
        required,
      };
    }

    if (!required) {
      return {
        key,
        status: "warn",
        message: `${key} is unset`,
        required,
      };
    }

    return {
      key,
      status: "fail",
      message: `${key} is required`,
      required,
    };
  }

  private checkHttps(configuration: DeploymentConfiguration): EnvironmentCheck {
    if (!configuration.requireHttps || configuration.target === "development") {
      return {
        key: "PUBLIC_HTTPS",
        status: "pass",
        message: "HTTPS requirement not enforced for this target",
        required: false,
      };
    }

    const publicUrl = this.env.PUBLIC_API_URL ?? this.env.APP_URL;
    if (publicUrl?.startsWith("https://")) {
      return {
        key: "PUBLIC_HTTPS",
        status: "pass",
        message: "Public URL uses HTTPS",
        required: true,
      };
    }

    return {
      key: "PUBLIC_HTTPS",
      status: "fail",
      message: "Public HTTPS URL is required for this deployment target",
      required: true,
    };
  }

  private checkNodeVersion(minimumNodeVersion: string): EnvironmentCheck {
    const currentMajor = Number.parseInt(
      this.nodeVersion.replace(/^v/, "").split(".")[0] ?? "0",
      10,
    );
    const requiredMajor = Number.parseInt(
      minimumNodeVersion.split(".")[0] ?? "0",
      10,
    );

    if (currentMajor >= requiredMajor) {
      return {
        key: "NODE_VERSION",
        status: "pass",
        message: `Node ${this.nodeVersion} meets minimum ${minimumNodeVersion}`,
        required: true,
      };
    }

    return {
      key: "NODE_VERSION",
      status: "fail",
      message: `Node ${this.nodeVersion} is below minimum ${minimumNodeVersion}`,
      required: true,
    };
  }
}

export const environmentDiagnosticsService = new EnvironmentDiagnosticsService();
