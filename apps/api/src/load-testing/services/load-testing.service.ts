import type {
  LoadTestingConfiguration,
  LoadTestingSummary,
  PerformanceBaseline,
  ScalabilityAssessment,
} from "@commerceflow/types";
import type { UpdateLoadTestingConfigurationInput } from "@commerceflow/validation";

import {
  getDomainEventPublisher,
  type DomainEventPublisher,
} from "@/domain-events";
import {
  getLoadTestingConfigurationRepository,
  type LoadTestingConfigurationRepository,
} from "../repositories";
import {
  PerformanceBaselineService,
  performanceBaselineService,
} from "./performance-baseline.service";
import {
  ScalabilityAssessmentService,
  scalabilityAssessmentService,
} from "./scalability-assessment.service";

export interface LoadTestingServiceDependencies {
  readonly configurationRepository?: LoadTestingConfigurationRepository;
  readonly performanceBaselineService?: PerformanceBaselineService;
  readonly scalabilityAssessmentService?: ScalabilityAssessmentService;
  readonly domainEventPublisher?: DomainEventPublisher;
  readonly now?: () => Date;
}

export class LoadTestingService {
  private readonly configurationRepository: LoadTestingConfigurationRepository;
  private readonly performanceBaselineService: PerformanceBaselineService;
  private readonly scalabilityAssessmentService: ScalabilityAssessmentService;
  private readonly domainEventPublisher: DomainEventPublisher;
  private readonly now: () => Date;

  constructor(dependencies: LoadTestingServiceDependencies = {}) {
    this.configurationRepository =
      dependencies.configurationRepository ??
      getLoadTestingConfigurationRepository();
    this.performanceBaselineService =
      dependencies.performanceBaselineService ?? performanceBaselineService;
    this.scalabilityAssessmentService =
      dependencies.scalabilityAssessmentService ?? scalabilityAssessmentService;
    this.domainEventPublisher =
      dependencies.domainEventPublisher ?? getDomainEventPublisher();
    this.now = dependencies.now ?? (() => new Date());
  }

  getBaselines(): PerformanceBaseline {
    return this.performanceBaselineService.getBaselines();
  }

  getAssessment(): Promise<ScalabilityAssessment> {
    return this.scalabilityAssessmentService.getAssessment();
  }

  async getSummary(): Promise<LoadTestingSummary> {
    const [configuration, baselines, assessment] = await Promise.all([
      this.configurationRepository.getConfiguration(),
      Promise.resolve(this.performanceBaselineService.getBaselines()),
      this.scalabilityAssessmentService.getAssessment(),
    ]);

    return {
      configuration,
      baselines,
      assessment,
      checkedAt: this.now().toISOString(),
    };
  }

  async updateConfiguration(
    input: UpdateLoadTestingConfigurationInput,
  ): Promise<LoadTestingConfiguration> {
    const configuration = await this.configurationRepository.updateConfiguration(
      {
        enabled: input.enabled,
        preferredTool: input.preferredTool,
        targetVirtualUsers: input.targetVirtualUsers,
        durationSeconds: input.durationSeconds,
        rampUpSeconds: input.rampUpSeconds,
        notes: input.notes,
      },
    );

    this.domainEventPublisher.publishPlatformLoadTestingUpdated(
      configuration,
      input.storeId,
    );

    return configuration;
  }
}

export const loadTestingService = new LoadTestingService();
