import { describe, expect, it, vi } from "vitest";

import { MemoryAuditLogRepository } from "@/audit/repositories/memory-audit-log.repository";
import { AuditService } from "@/audit/services/audit.service";
import {
  createMemoryAuthorizationService,
  registerStaffUser,
} from "@/authorization/testing/authorization-test-utils";
import {
  createMemoryDatabaseOptimizationModule,
  TEST_STORE_A_ID,
} from "../testing/database-optimization-test-utils";

describe("Database optimization audit integration", () => {
  it("records database_diagnostics audit entries", async () => {
    const auditLogRepository = new MemoryAuditLogRepository();
    const auditService = new AuditService({ auditLogRepository });
    const module = createMemoryDatabaseOptimizationModule();
    const { authService, storeMemberRepository } =
      createMemoryAuthorizationService();
    const { user } = await registerStaffUser(authService);

    storeMemberRepository.seedMember({
      storeId: TEST_STORE_A_ID,
      userId: user.id,
      role: "admin",
    });

    const authContext = {
      userId: user.id,
      sessionId: "session-id",
      storeId: TEST_STORE_A_ID,
      storeRole: "admin" as const,
      permission: "platform:read" as const,
    };

    const diagnostics = await module.databaseOptimizationFacade.getDiagnostics();

    auditService.recordFromAuthContext(authContext, {
      entityType: "platform",
      entityId: "platform",
      action: "database_diagnostics",
      metadata: {
        status: diagnostics.status,
        databaseReachable: diagnostics.databaseReachable,
        indexCount: diagnostics.indexes.total,
        migrationCount: diagnostics.migrations.migrationCount,
        migrationsConsistent: diagnostics.migrations.consistent,
      },
    });

    await vi.waitFor(() => {
      expect(auditLogRepository.getAll()).toHaveLength(1);
    });

    expect(auditLogRepository.getAll()[0]).toMatchObject({
      entityType: "platform",
      action: "database_diagnostics",
      metadata: {
        status: "healthy",
        databaseReachable: true,
      },
    });
  });
});
