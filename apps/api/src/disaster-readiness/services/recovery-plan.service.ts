import type {
  RecoveryChecklistItem,
  RecoveryObjectives,
  RecoveryPlan,
} from "@commerceflow/types";
import type { UpdateRecoveryObjectivesInput } from "@commerceflow/validation";

import {
  getDomainEventPublisher,
  type DomainEventPublisher,
} from "@/domain-events";
import {
  getDisasterReadinessConfigurationRepository,
  type DisasterReadinessConfigurationRepository,
} from "../repositories";

export const DEFAULT_RECOVERY_CHECKLIST: readonly RecoveryChecklistItem[] = [
  {
    id: "confirm-backup-availability",
    title: "Confirm backup availability",
    description:
      "Verify the latest external backup artifact is reachable and readable",
    required: true,
    category: "backup",
  },
  {
    id: "notify-stakeholders",
    title: "Notify stakeholders",
    description: "Inform owners and operators that recovery procedures started",
    required: true,
    category: "communication",
  },
  {
    id: "restore-to-staging",
    title: "Restore to staging",
    description:
      "Restore the selected backup into an isolated staging environment first",
    required: true,
    category: "restore",
  },
  {
    id: "validate-critical-flows",
    title: "Validate critical flows",
    description:
      "Run smoke checks for auth, catalogue reads, and order placement",
    required: true,
    category: "validation",
  },
  {
    id: "promote-and-monitor",
    title: "Promote and monitor",
    description:
      "Promote recovered data only after validation, then monitor error rates",
    required: true,
    category: "validation",
  },
];

export interface RecoveryPlanServiceDependencies {
  readonly configurationRepository?: DisasterReadinessConfigurationRepository;
  readonly domainEventPublisher?: DomainEventPublisher;
  readonly checklist?: readonly RecoveryChecklistItem[];
  readonly now?: () => Date;
}

export class RecoveryPlanService {
  private readonly configurationRepository: DisasterReadinessConfigurationRepository;
  private readonly domainEventPublisher: DomainEventPublisher;
  private readonly checklist: readonly RecoveryChecklistItem[];
  private readonly now: () => Date;

  constructor(dependencies: RecoveryPlanServiceDependencies = {}) {
    this.configurationRepository =
      dependencies.configurationRepository ??
      getDisasterReadinessConfigurationRepository();
    this.domainEventPublisher =
      dependencies.domainEventPublisher ?? getDomainEventPublisher();
    this.checklist = dependencies.checklist ?? DEFAULT_RECOVERY_CHECKLIST;
    this.now = dependencies.now ?? (() => new Date());
  }

  async getRecoveryPlan(): Promise<RecoveryPlan> {
    const objectives =
      await this.configurationRepository.getRecoveryObjectives();

    return {
      objectives,
      checklist: [...this.checklist],
      generatedAt: this.now().toISOString(),
    };
  }

  async updateRecoveryObjectives(
    input: UpdateRecoveryObjectivesInput,
  ): Promise<RecoveryObjectives> {
    const objectives =
      await this.configurationRepository.updateRecoveryObjectives({
        rpoMinutes: input.rpoMinutes,
        rtoMinutes: input.rtoMinutes,
      });

    this.domainEventPublisher.publishPlatformRecoveryObjectivesUpdated(
      objectives,
      input.storeId,
    );

    return objectives;
  }
}

export const recoveryPlanService = new RecoveryPlanService();
