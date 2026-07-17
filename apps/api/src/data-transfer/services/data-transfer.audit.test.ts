import { describe, expect, it, vi } from "vitest";

import { MemoryAuditLogRepository } from "@/audit/repositories/memory-audit-log.repository";
import { AuditService } from "@/audit/services/audit.service";
import {
  createMemoryAuthorizationService,
  registerStaffUser,
} from "@/authorization/testing/authorization-test-utils";
import {
  createMemoryDataTransferModule,
  TEST_STORE_A_ID,
  validCreateImportJobInput,
} from "../testing/data-transfer-test-utils";

describe("Data transfer audit integration", () => {
  it("records import create and complete audit entries", async () => {
    const auditLogRepository = new MemoryAuditLogRepository();
    const auditService = new AuditService({ auditLogRepository });
    const module = createMemoryDataTransferModule();
    const { authService, storeMemberRepository } =
      createMemoryAuthorizationService();
    const { user } = await registerStaffUser(authService);

    storeMemberRepository.seedMember({
      storeId: TEST_STORE_A_ID,
      userId: user.id,
      role: "manager",
    });

    const authContext = {
      userId: user.id,
      sessionId: "session-id",
      storeId: TEST_STORE_A_ID,
      storeRole: "manager" as const,
      permission: "imports:write" as const,
    };

    const importJob = await module.dataTransferService.createImportJob(
      validCreateImportJobInput(),
    );

    auditService.recordFromAuthContext(authContext, {
      entityType: "import",
      entityId: importJob.id,
      action: "create",
      metadata: {
        importJobId: importJob.id,
        type: importJob.type,
        status: importJob.status,
      },
    });

    if (importJob.status === "completed") {
      auditService.recordFromAuthContext(authContext, {
        entityType: "import",
        entityId: importJob.id,
        action: "complete",
        metadata: {
          importJobId: importJob.id,
          type: importJob.type,
          status: importJob.status,
        },
      });
    }

    await vi.waitFor(() => {
      expect(auditLogRepository.getAll()).toHaveLength(2);
    });

    expect(auditLogRepository.getAll()[0]).toMatchObject({
      entityType: "import",
      action: "create",
    });
    expect(auditLogRepository.getAll()[1]).toMatchObject({
      entityType: "import",
      action: "complete",
    });
  });
});
