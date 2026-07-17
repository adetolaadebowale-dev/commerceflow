import type {
  DeploymentConfiguration,
  ReleaseMetadata,
  VersionCompatibilityDiagnostics,
} from "@commerceflow/types";

import {
  getDeploymentConfigurationRepository,
  type DeploymentConfigurationRepository,
} from "../repositories";

export interface ReleaseValidationServiceDependencies {
  readonly configurationRepository?: DeploymentConfigurationRepository;
  readonly packageName?: string;
  readonly packageVersion?: string;
  readonly nodeVersion?: string;
  readonly buildId?: string;
  readonly now?: () => Date;
}

export class ReleaseValidationService {
  private readonly configurationRepository: DeploymentConfigurationRepository;
  private readonly packageName: string;
  private readonly packageVersion: string;
  private readonly nodeVersion: string;
  private readonly buildId?: string;
  private readonly now: () => Date;

  constructor(dependencies: ReleaseValidationServiceDependencies = {}) {
    this.configurationRepository =
      dependencies.configurationRepository ??
      getDeploymentConfigurationRepository();
    this.packageName = dependencies.packageName ?? "api";
    this.packageVersion = dependencies.packageVersion ?? "0.1.0";
    this.nodeVersion = dependencies.nodeVersion ?? process.version;
    this.buildId = dependencies.buildId ?? process.env.BUILD_ID;
    this.now = dependencies.now ?? (() => new Date());
  }

  async getReleaseMetadata(
    configuration?: DeploymentConfiguration,
  ): Promise<ReleaseMetadata> {
    const resolvedConfiguration =
      configuration ?? (await this.configurationRepository.getConfiguration());

    return {
      name: this.packageName,
      version: this.packageVersion,
      channel: resolvedConfiguration.releaseChannel,
      compatibleNodeRange: `>=${resolvedConfiguration.minimumNodeVersion}`,
      buildId: this.buildId,
      releasedAt: undefined,
      checkedAt: this.now().toISOString(),
    };
  }

  async getVersionCompatibility(
    configuration?: DeploymentConfiguration,
  ): Promise<VersionCompatibilityDiagnostics> {
    const resolvedConfiguration =
      configuration ?? (await this.configurationRepository.getConfiguration());
    const currentMajor = Number.parseInt(
      this.nodeVersion.replace(/^v/, "").split(".")[0] ?? "0",
      10,
    );
    const requiredMajor = Number.parseInt(
      resolvedConfiguration.minimumNodeVersion.split(".")[0] ?? "0",
      10,
    );
    const compatible = currentMajor >= requiredMajor;

    return {
      compatible,
      currentNodeVersion: this.nodeVersion,
      requiredNodeVersion: resolvedConfiguration.minimumNodeVersion,
      message: compatible
        ? `Node ${this.nodeVersion} is compatible with release requirements`
        : `Node ${this.nodeVersion} does not satisfy minimum ${resolvedConfiguration.minimumNodeVersion}`,
    };
  }
}

export const releaseValidationService = new ReleaseValidationService();
