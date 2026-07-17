import type {
  CapacityPlanningRecommendation,
  LoadTestingConfiguration,
  PerformanceBaseline,
  ScalabilityAssessment,
  ScalabilityAssessmentStatus,
} from "@commerceflow/types";

import {
  getLoadTestingConfigurationRepository,
  type LoadTestingConfigurationRepository,
} from "../repositories";
import {
  PerformanceBaselineService,
  performanceBaselineService,
} from "./performance-baseline.service";

export interface ScalabilityAssessmentServiceDependencies {
  readonly configurationRepository?: LoadTestingConfigurationRepository;
  readonly performanceBaselineService?: PerformanceBaselineService;
  readonly now?: () => Date;
}

export class ScalabilityAssessmentService {
  private readonly configurationRepository: LoadTestingConfigurationRepository;
  private readonly performanceBaselineService: PerformanceBaselineService;
  private readonly now: () => Date;

  constructor(dependencies: ScalabilityAssessmentServiceDependencies = {}) {
    this.configurationRepository =
      dependencies.configurationRepository ??
      getLoadTestingConfigurationRepository();
    this.performanceBaselineService =
      dependencies.performanceBaselineService ?? performanceBaselineService;
    this.now = dependencies.now ?? (() => new Date());
  }

  async getAssessment(): Promise<ScalabilityAssessment> {
    const [configuration, baselines] = await Promise.all([
      this.configurationRepository.getConfiguration(),
      Promise.resolve(this.performanceBaselineService.getBaselines()),
    ]);
    const recommendations = this.buildRecommendations(configuration, baselines);

    return {
      status: this.deriveStatus(configuration, recommendations),
      configuration,
      baselines,
      recommendations,
      checkedAt: this.now().toISOString(),
    };
  }

  private buildRecommendations(
    configuration: LoadTestingConfiguration,
    baselines: PerformanceBaseline,
  ): CapacityPlanningRecommendation[] {
    const recommendations: CapacityPlanningRecommendation[] = [
      {
        code: "document-external-runner",
        severity: "info",
        message:
          "Execute load scenarios with an external runner using the configured tool preference",
      },
      {
        code: "protect-auth-endpoints",
        severity: "info",
        message:
          "Keep auth and write endpoints at lower concurrency than catalogue reads",
        relatedEndpointKey: "auth.login",
      },
    ];

    if (!configuration.enabled) {
      recommendations.push({
        code: "enable-load-testing-config",
        severity: "warn",
        message:
          "Load testing configuration is disabled; enable it before capacity campaigns",
      });
    }

    if (configuration.targetVirtualUsers > 500) {
      recommendations.push({
        code: "staged-ramp",
        severity: "warn",
        message:
          "Target virtual users exceed 500; use staged ramp-ups and monitor database saturation",
      });
    }

    for (const endpoint of baselines.endpoints) {
      if (endpoint.p95Ms > 200) {
        recommendations.push({
          code: `baseline-p95:${endpoint.endpointKey}`,
          severity: "warn",
          message: `${endpoint.endpointKey} p95 baseline is ${endpoint.p95Ms}ms; prioritize query/index review before high load`,
          relatedEndpointKey: endpoint.endpointKey,
        });
      }

      if (
        configuration.targetVirtualUsers > endpoint.maxRps * 2 &&
        configuration.enabled
      ) {
        recommendations.push({
          code: `capacity:${endpoint.endpointKey}`,
          severity: "critical",
          message: `Configured VUs (${configuration.targetVirtualUsers}) exceed 2x declared max RPS for ${endpoint.endpointKey}`,
          relatedEndpointKey: endpoint.endpointKey,
        });
      }
    }

    return recommendations;
  }

  private deriveStatus(
    configuration: LoadTestingConfiguration,
    recommendations: readonly CapacityPlanningRecommendation[],
  ): ScalabilityAssessmentStatus {
    if (recommendations.some((item) => item.severity === "critical")) {
      return "at_risk";
    }

    if (
      !configuration.enabled ||
      recommendations.some((item) => item.severity === "warn")
    ) {
      return "needs_attention";
    }

    return "adequate";
  }
}

export const scalabilityAssessmentService = new ScalabilityAssessmentService();
