import { describe, expect, it, vi } from "vitest";

import { MemoryAuditLogRepository } from "@/audit/repositories/memory-audit-log.repository";
import { AuditService } from "@/audit/services/audit.service";
import {
  createMemoryAuthorizationService,
  registerStaffUser,
} from "@/authorization/testing/authorization-test-utils";
import {
  createDraftInvoice,
  createMemoryInvoiceModule,
  TEST_STORE_A_ID,
} from "../testing/invoice-test-utils";

describe("Invoice audit integration", () => {
  it("records invoice create and lifecycle audit entries", async () => {
    const auditLogRepository = new MemoryAuditLogRepository();
    const auditService = new AuditService({ auditLogRepository });
    const module = createMemoryInvoiceModule();
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
      permission: "invoices:write" as const,
    };

    const { invoice } = await createDraftInvoice(module);

    auditService.recordFromAuthContext(authContext, {
      entityType: "invoice",
      entityId: invoice.id,
      action: "create",
      metadata: {
        orderId: invoice.orderId,
        invoiceNumber: invoice.invoiceNumber,
        status: invoice.status,
      },
    });

    const issued = await module.invoiceService.issueInvoice(
      { storeId: TEST_STORE_A_ID },
      invoice.id,
    );

    auditService.recordFromAuthContext(
      { ...authContext, permission: "invoices:lifecycle" },
      {
        entityType: "invoice",
        entityId: issued.id,
        action: "issue",
        metadata: {
          orderId: issued.orderId,
          status: issued.status,
        },
      },
    );

    await vi.waitFor(() => {
      expect(auditLogRepository.getAll()).toHaveLength(2);
    });

    expect(auditLogRepository.getAll()[0]).toMatchObject({
      entityType: "invoice",
      action: "create",
      storeId: TEST_STORE_A_ID,
      userId: user.id,
    });
    expect(auditLogRepository.getAll()[1]).toMatchObject({
      entityType: "invoice",
      action: "issue",
    });
  });
});
