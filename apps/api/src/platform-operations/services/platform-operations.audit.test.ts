import { describe, expect, it, vi } from "vitest";

import { MemoryAuditLogRepository } from "@/audit/repositories/memory-audit-log.repository";
import { AuditService } from "@/audit/services/audit.service";
import {
  createMemoryAuthorizationService,
  registerStaffUser,
} from "@/authorization/testing/authorization-test-utils";
import {
  createMemoryPlatformOperationsModule,
  TEST_STORE_A_ID,
} from "../testing/platform-operations-test-utils";

describe("Platform operations audit integration", () => {
  it("records maintenance enable and disable audit entries", async () => {
    const auditLogRepository = new MemoryAuditLogRepository();
    const auditService = new AuditService({ auditLogRepository });
    const module = createMemoryPlatformOperationsModule();
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

    const enabled = await module.platformOperationsService.updateMaintenanceMode({
      storeId: TEST_STORE_A_ID,
      maintenanceMode: true,
      maintenanceMessage: "Offline",
    });

    auditService.recordFromAuthContext(authContext, {
      entityType: "platform",
      entityId: "platform",
      action: "maintenance_enable",
      metadata: {
        maintenanceMode: enabled.maintenanceMode,
        maintenanceMessage: enabled.maintenanceMessage,
      },
    });

    const disabled =
      await module.platformOperationsService.updateMaintenanceMode({
        storeId: TEST_STORE_A_ID,
        maintenanceMode: false,
      });

    auditService.recordFromAuthContext(authContext, {
      entityType: "platform",
      entityId: "platform",
      action: "maintenance_disable",
      metadata: {
        maintenanceMode: disabled.maintenanceMode,
      },
    });

    await vi.waitFor(() => {
      expect(auditLogRepository.getAll()).toHaveLength(2);
    });

    expect(auditLogRepository.getAll()[0]).toMatchObject({
      entityType: "platform",
      action: "maintenance_enable",
    });
    expect(auditLogRepository.getAll()[1]).toMatchObject({
      entityType: "platform",
      action: "maintenance_disable",
    });
  });
});
