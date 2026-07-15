import { describe, expect, it } from "vitest";

import { MemoryAuditLogRepository } from "@/audit/repositories/memory-audit-log.repository";
import { AuditService } from "@/audit/services/audit.service";
import {
  createMemoryAuthorizationService,
  registerStaffUser,
} from "@/authorization/testing/authorization-test-utils";
import {
  createMemoryCycleCountModule,
  seedCompletedCycleCount,
  TEST_STORE_A_ID,
} from "../testing/cycle-count-test-utils";

const TEST_USER_ID = "99999999-9999-9999-9999-999999999999";

describe("Cycle count audit integration", () => {
  it("records create, start, complete, and approve audit entries", async () => {
    const auditLogRepository = new MemoryAuditLogRepository();
    const auditService = new AuditService({ auditLogRepository });
    const module = createMemoryCycleCountModule();
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
      permission: "inventory:write" as const,
    };

    const { cycleCount } = await seedCompletedCycleCount(module, {
      initialQuantity: 10,
      countedQuantity: 9,
    });

    auditService.recordFromAuthContext(authContext, {
      entityType: "cycle_count",
      entityId: cycleCount.id,
      action: "complete",
      metadata: { cycleCountNumber: cycleCount.cycleCountNumber },
    });

    const result = await module.cycleCountService.approveCycleCount(
      cycleCount.id,
      { storeId: TEST_STORE_A_ID },
      TEST_USER_ID,
    );

    auditService.recordFromAuthContext(authContext, {
      entityType: "cycle_count",
      entityId: result.cycleCount.id,
      action: "approve",
      metadata: {
        cycleCountNumber: result.cycleCount.cycleCountNumber,
        adjustmentCount: result.adjustments.length,
      },
    });

    const logs = await auditLogRepository.list({
      storeId: TEST_STORE_A_ID,
      page: 1,
      limit: 20,
    });

    expect(logs.items.some((entry) => entry.entityType === "cycle_count")).toBe(
      true,
    );
    expect(
      logs.items.some(
        (entry) =>
          entry.entityType === "cycle_count" && entry.action === "approve",
      ),
    ).toBe(true);
  });
});
