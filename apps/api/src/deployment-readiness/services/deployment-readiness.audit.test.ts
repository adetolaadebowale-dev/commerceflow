import { describe, expect, it, vi } from "vitest";

import { MemoryAuditLogRepository } from "@/audit/repositories/memory-audit-log.repository";
import { AuditService } from "@/audit/services/audit.service";
import {
  createMemoryAuthorizationService,
  registerStaffUser,
} from "@/authorization/testing/authorization-test-utils";
import {
  createMemoryDeploymentReadinessModule,
  TEST_STORE_A_ID,
} from "../testing/deployment-readiness-test-utils";

describe("Deployment readiness audit integration", () => {
  it("records deployment_configuration_update audit entries", async () => {
    const auditLogRepository = new MemoryAuditLogRepository();
    const auditService = new AuditService({ auditLogRepository });
    const module = createMemoryDeploymentReadinessModule();
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

    const configuration =
      await module.deploymentReadinessService.updateConfiguration({
        storeId: TEST_STORE_A_ID,
        target: "production",
        requireHttps: true,
        requireMigrationsApplied: true,
        minimumNodeVersion: "20",
        releaseChannel: "stable",
      });

    auditService.recordFromAuthContext(authContext, {
      entityType: "platform",
      entityId: "platform",
      action: "deployment_configuration_update",
      metadata: {
        target: configuration.target,
        releaseChannel: configuration.releaseChannel,
        updatedAt: configuration.updatedAt,
      },
    });

    await vi.waitFor(() => {
      expect(auditLogRepository.getAll()).toHaveLength(1);
    });

    expect(auditLogRepository.getAll()[0]).toMatchObject({
      entityType: "platform",
      action: "deployment_configuration_update",
      metadata: {
        target: "production",
        releaseChannel: "stable",
      },
    });
  });
});
