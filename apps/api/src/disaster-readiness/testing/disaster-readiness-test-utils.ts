import type { DomainEventPublisher } from "@/domain-events";
import { MemoryDisasterReadinessConfigurationRepository } from "../repositories/memory-disaster-readiness-configuration.repository";
import { BackupVerificationService } from "../services/backup-verification.service";
import { DisasterReadinessFacade } from "../services/disaster-readiness.facade";
import { DisasterReadinessService } from "../services/disaster-readiness.service";
import { RecoveryPlanService } from "../services/recovery-plan.service";

export const TEST_STORE_A_ID = "11111111-1111-1111-1111-111111111111";

export function createMemoryDisasterReadinessModule(options: {
  domainEventPublisher?: DomainEventPublisher;
  now?: () => Date;
} = {}) {
  const configurationRepository =
    new MemoryDisasterReadinessConfigurationRepository();
  const backupVerificationService = new BackupVerificationService({
    configurationRepository,
    now: options.now,
  });
  const recoveryPlanService = new RecoveryPlanService({
    configurationRepository,
    domainEventPublisher: options.domainEventPublisher,
    now: options.now,
  });
  const disasterReadinessService = new DisasterReadinessService({
    backupVerificationService,
    recoveryPlanService,
    now: options.now,
  });

  return {
    configurationRepository,
    backupVerificationService,
    recoveryPlanService,
    disasterReadinessService,
    disasterReadinessFacade: new DisasterReadinessFacade({
      backupVerificationService,
      recoveryPlanService,
      disasterReadinessService,
    }),
  };
}
