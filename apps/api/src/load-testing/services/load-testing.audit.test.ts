import { describe, expect, it, vi } from "vitest";

import { MemoryAuditLogRepository } from "@/audit/repositories/memory-audit-log.repository";
import { AuditService } from "@/audit/services/audit.service";
import {
  createMemoryAuthorizationService,
  registerStaffUser,
} from "@/authorization/testing/authorization-test-utils";
import {
  createMemoryLoadTestingModule,
  TEST_STORE_A_ID,
} from "../testing/load-testing-test-utils";

describe("Load testing audit integration", () => {
  it("records load_testing_configuration_update audit entries", async () => {
    const auditLogRepository = new MemoryAuditLogRepository();
    const auditService = new AuditService({ auditLogRepository });
    const module = createMemoryLoadTestingModule();
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

    const configuration = await module.loadTestingService.updateConfiguration({
      storeId: TEST_STORE_A_ID,
      enabled: true,
      preferredTool: "gatling",
      targetVirtualUsers: 40,
      durationSeconds: 120,
      rampUpSeconds: 20,
    });

    auditService.recordFromAuthContext(authContext, {
      entityType: "platform",
      entityId: "platform",
      action: "load_testing_configuration_update",
      metadata: {
        enabled: configuration.enabled,
        preferredTool: configuration.preferredTool,
        targetVirtualUsers: configuration.targetVirtualUsers,
        updatedAt: configuration.updatedAt,
      },
    });

    await vi.waitFor(() => {
      expect(auditLogRepository.getAll()).toHaveLength(1);
    });

    expect(auditLogRepository.getAll()[0]).toMatchObject({
      entityType: "platform",
      action: "load_testing_configuration_update",
      metadata: {
        enabled: true,
        preferredTool: "gatling",
        targetVirtualUsers: 40,
      },
    });
  });
});
