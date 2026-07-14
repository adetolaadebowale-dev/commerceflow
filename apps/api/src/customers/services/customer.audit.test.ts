import { describe, expect, it, vi } from "vitest";

import { MemoryAuditLogRepository } from "@/audit/repositories/memory-audit-log.repository";
import { AuditService } from "@/audit/services/audit.service";
import {
  createMemoryAuthorizationService,
  registerStaffUser,
  TEST_STORE_A_ID,
} from "@/authorization/testing/authorization-test-utils";
import {
  createMemoryCustomerService,
  validCustomerInput,
} from "../testing/customer-test-utils";

describe("Customer audit integration", () => {
  it("records customer create and update audit entries", async () => {
    const auditLogRepository = new MemoryAuditLogRepository();
    const auditService = new AuditService({ auditLogRepository });
    const { customerService } = createMemoryCustomerService();
    const { authService, storeMemberRepository } =
      createMemoryAuthorizationService();
    const { user, tokens } = await registerStaffUser(authService);

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
      permission: "customers:write" as const,
    };

    const customer = await customerService.createCustomer(validCustomerInput());
    auditService.recordFromAuthContext(authContext, {
      entityType: "customer",
      entityId: customer.id,
      action: "create",
      metadata: {
        email: customer.email,
        firstName: customer.firstName,
        lastName: customer.lastName,
        status: customer.status,
      },
    });

    await vi.waitFor(() => {
      expect(auditLogRepository.getAll()).toHaveLength(1);
    });

    const updated = await customerService.updateCustomer(
      TEST_STORE_A_ID,
      customer.id,
      { firstName: "Updated" },
    );
    auditService.recordFromAuthContext(authContext, {
      entityType: "customer",
      entityId: updated.id,
      action: "update",
      metadata: {
        email: updated.email,
        firstName: updated.firstName,
        lastName: updated.lastName,
        status: updated.status,
      },
    });

    await vi.waitFor(() => {
      expect(auditLogRepository.getAll()).toHaveLength(2);
    });

    expect(auditLogRepository.getAll()[0]).toMatchObject({
      entityType: "customer",
      action: "create",
      storeId: TEST_STORE_A_ID,
      userId: user.id,
    });
    expect(auditLogRepository.getAll()[1]).toMatchObject({
      entityType: "customer",
      action: "update",
    });

    expect(tokens.accessToken).toBeTruthy();
  });
});
