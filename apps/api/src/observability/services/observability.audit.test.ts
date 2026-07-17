import { describe, expect, it, vi } from "vitest";

import { MemoryAuditLogRepository } from "@/audit/repositories/memory-audit-log.repository";
import { AuditService } from "@/audit/services/audit.service";
import {
  createMemoryAuthorizationService,
  registerStaffUser,
} from "@/authorization/testing/authorization-test-utils";
import {
  createMemoryObservabilityModule,
  TEST_STORE_A_ID,
} from "../testing/observability-test-utils";

describe("Observability audit integration", () => {
  it("records logging_diagnostics audit entries", async () => {
    const auditLogRepository = new MemoryAuditLogRepository();
    const auditService = new AuditService({ auditLogRepository });
    const module = createMemoryObservabilityModule();
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

    const diagnostics = module.observabilityFacade.getDiagnostics();

    auditService.recordFromAuthContext(authContext, {
      entityType: "platform",
      entityId: "platform",
      action: "logging_diagnostics",
      metadata: {
        status: diagnostics.status,
        totalEntries: diagnostics.summary.totalEntries,
        activeCorrelationContexts: diagnostics.activeCorrelationContexts,
        requestLoggingEnabled: diagnostics.requestLoggingEnabled,
      },
    });

    await vi.waitFor(() => {
      expect(auditLogRepository.getAll()).toHaveLength(1);
    });

    expect(auditLogRepository.getAll()[0]).toMatchObject({
      entityType: "platform",
      action: "logging_diagnostics",
      metadata: {
        status: "healthy",
        requestLoggingEnabled: true,
      },
    });
  });
});
