import { describe, expect, it, vi } from "vitest";

import { MemoryAuditLogRepository } from "@/audit/repositories/memory-audit-log.repository";
import { AuditService } from "@/audit/services/audit.service";
import {
  createMemoryAuthorizationService,
  registerStaffUser,
} from "@/authorization/testing/authorization-test-utils";
import {
  createMemoryRefundModule,
  createPendingRefund,
  TEST_STORE_A_ID,
} from "../testing/refund-test-utils";

describe("Refund audit integration", () => {
  it("records refund create and lifecycle audit entries", async () => {
    const auditLogRepository = new MemoryAuditLogRepository();
    const auditService = new AuditService({ auditLogRepository });
    const module = createMemoryRefundModule();
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
      permission: "refunds:write" as const,
    };

    const { refund } = await createPendingRefund(module);

    auditService.recordFromAuthContext(authContext, {
      entityType: "refund",
      entityId: refund.id,
      action: "create",
      metadata: {
        paymentId: refund.paymentId,
        amount: refund.amount,
        currency: refund.currency,
        status: refund.status,
        reason: refund.reason,
      },
    });

    const completed = await module.refundService.completeRefund(
      { storeId: TEST_STORE_A_ID },
      refund.id,
    );

    auditService.recordFromAuthContext(
      { ...authContext, permission: "refunds:lifecycle" },
      {
        entityType: "refund",
        entityId: completed.id,
        action: "complete",
        metadata: {
          paymentId: completed.paymentId,
          amount: completed.amount,
          currency: completed.currency,
          status: completed.status,
          reason: completed.reason,
        },
      },
    );

    await vi.waitFor(() => {
      expect(auditLogRepository.getAll()).toHaveLength(2);
    });

    expect(auditLogRepository.getAll()[0]).toMatchObject({
      entityType: "refund",
      action: "create",
      storeId: TEST_STORE_A_ID,
      userId: user.id,
    });
    expect(auditLogRepository.getAll()[1]).toMatchObject({
      entityType: "refund",
      action: "complete",
    });
  });
});
