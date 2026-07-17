import { describe, expect, it, vi } from "vitest";

import { MemoryAuditLogRepository } from "@/audit/repositories/memory-audit-log.repository";
import { AuditService } from "@/audit/services/audit.service";
import {
  createMemoryAuthorizationService,
  registerStaffUser,
} from "@/authorization/testing/authorization-test-utils";
import {
  createMemoryPlatformHardeningModule,
  TEST_STORE_A_ID,
} from "../testing/platform-hardening-test-utils";

describe("Platform hardening audit integration", () => {
  it("records cache_policy_update audit entries", async () => {
    const auditLogRepository = new MemoryAuditLogRepository();
    const auditService = new AuditService({ auditLogRepository });
    const module = createMemoryPlatformHardeningModule();
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

    const cachePolicy = await module.platformHardeningFacade.updateCachePolicy({
      storeId: TEST_STORE_A_ID,
      resource: "reports.dashboard",
      enabled: true,
      ttlSeconds: 45,
    });

    auditService.recordFromAuthContext(authContext, {
      entityType: "platform",
      entityId: "platform",
      action: "cache_policy_update",
      metadata: {
        resource: cachePolicy.resource,
        enabled: cachePolicy.enabled,
        ttlSeconds: cachePolicy.ttlSeconds,
      },
    });

    await vi.waitFor(() => {
      expect(auditLogRepository.getAll()).toHaveLength(1);
    });

    expect(auditLogRepository.getAll()[0]).toMatchObject({
      entityType: "platform",
      action: "cache_policy_update",
      metadata: {
        resource: "reports.dashboard",
        enabled: true,
        ttlSeconds: 45,
      },
    });
  });
});
