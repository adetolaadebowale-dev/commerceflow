import type { DomainEventPublisher } from "@/domain-events";
import { MemoryLoadTestingConfigurationRepository } from "../repositories/memory-load-testing-configuration.repository";
import { LoadTestingService } from "../services/load-testing.service";
import { PerformanceBaselineService } from "../services/performance-baseline.service";
import { ScalabilityAssessmentService } from "../services/scalability-assessment.service";

export const TEST_STORE_A_ID = "11111111-1111-1111-1111-111111111111";

export function createMemoryLoadTestingModule(options: {
  domainEventPublisher?: DomainEventPublisher;
  now?: () => Date;
} = {}) {
  const configurationRepository = new MemoryLoadTestingConfigurationRepository();
  const performanceBaselineService = new PerformanceBaselineService({
    now: options.now,
  });
  const scalabilityAssessmentService = new ScalabilityAssessmentService({
    configurationRepository,
    performanceBaselineService,
    now: options.now,
  });
  const loadTestingService = new LoadTestingService({
    configurationRepository,
    performanceBaselineService,
    scalabilityAssessmentService,
    domainEventPublisher: options.domainEventPublisher,
    now: options.now,
  });

  return {
    configurationRepository,
    performanceBaselineService,
    scalabilityAssessmentService,
    loadTestingService,
  };
}
