import { describe, expect, it, vi } from "vitest";

import { MemoryAuditLogRepository } from "@/audit/repositories/memory-audit-log.repository";
import { AuditService } from "@/audit/services/audit.service";
import {
  createMemoryAuthorizationService,
  registerStaffUser,
} from "@/authorization/testing/authorization-test-utils";
import {
  createMemoryPaymentModule,
  createPendingPayment,
  TEST_STORE_A_ID,
} from "../testing/payment-test-utils";

describe("Payment audit integration", () => {
  it("records payment create and lifecycle audit entries", async () => {
    const auditLogRepository = new MemoryAuditLogRepository();
    const auditService = new AuditService({ auditLogRepository });
    const module = createMemoryPaymentModule();
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
      permission: "payments:write" as const,
    };

    const { payment } = await createPendingPayment(module);

    auditService.recordFromAuthContext(authContext, {
      entityType: "payment",
      entityId: payment.id,
      action: "create",
      metadata: {
        orderId: payment.orderId,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
      },
    });

    const authorized = await module.paymentService.authorizePayment(
      { storeId: TEST_STORE_A_ID },
      payment.id,
    );

    auditService.recordFromAuthContext(
      { ...authContext, permission: "payments:lifecycle" },
      {
        entityType: "payment",
        entityId: authorized.id,
        action: "authorize",
        metadata: {
          orderId: authorized.orderId,
          status: authorized.status,
        },
      },
    );

    await vi.waitFor(() => {
      expect(auditLogRepository.getAll()).toHaveLength(2);
    });

    expect(auditLogRepository.getAll()[0]).toMatchObject({
      entityType: "payment",
      action: "create",
      storeId: TEST_STORE_A_ID,
      userId: user.id,
    });
    expect(auditLogRepository.getAll()[1]).toMatchObject({
      entityType: "payment",
      action: "authorize",
    });
  });
});
