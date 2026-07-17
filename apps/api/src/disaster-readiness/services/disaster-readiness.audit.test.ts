import { describe, expect, it, vi } from "vitest";

import { MemoryAuditLogRepository } from "@/audit/repositories/memory-audit-log.repository";
import { AuditService } from "@/audit/services/audit.service";
import {
  createMemoryAuthorizationService,
  registerStaffUser,
} from "@/authorization/testing/authorization-test-utils";
import {
  createMemoryDisasterReadinessModule,
  TEST_STORE_A_ID,
} from "../testing/disaster-readiness-test-utils";

describe("Disaster readiness audit integration", () => {
  it("records recovery_objectives_update audit entries", async () => {
    const auditLogRepository = new MemoryAuditLogRepository();
    const auditService = new AuditService({ auditLogRepository });
    const module = createMemoryDisasterReadinessModule();
    const { authService, storeMemberRepository } =
      createMemoryAuthorizationService();
    const { user } = await registerStaffUser(authService);

    storeMemberRepository.seedMember({
      storeId: TEST_STORE_A_ID,
      userId: user.id,
      role: "owner",
    });

    const authContext = {
      userId: user.id,
      sessionId: "session-id",
      storeId: TEST_STORE_A_ID,
      storeRole: "owner" as const,
      permission: "platform:write" as const,
    };

    const recoveryObjectives =
      await module.disasterReadinessFacade.updateRecoveryObjectives({
        storeId: TEST_STORE_A_ID,
        rpoMinutes: 45,
        rtoMinutes: 180,
      });

    auditService.recordFromAuthContext(authContext, {
      entityType: "platform",
      entityId: "platform",
      action: "recovery_objectives_update",
      metadata: {
        rpoMinutes: recoveryObjectives.rpoMinutes,
        rtoMinutes: recoveryObjectives.rtoMinutes,
        updatedAt: recoveryObjectives.updatedAt,
      },
    });

    await vi.waitFor(() => {
      expect(auditLogRepository.getAll()).toHaveLength(1);
    });

    expect(auditLogRepository.getAll()[0]).toMatchObject({
      entityType: "platform",
      action: "recovery_objectives_update",
      metadata: {
        rpoMinutes: 45,
        rtoMinutes: 180,
      },
    });
  });
});
