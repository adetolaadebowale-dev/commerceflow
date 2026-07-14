import { describe, expect, it, vi } from "vitest";

import { MemoryAuditLogRepository } from "@/audit/repositories/memory-audit-log.repository";
import { AuditService } from "@/audit/services/audit.service";
import {
  createMemoryAuthorizationService,
  registerStaffUser,
  TEST_STORE_A_ID,
} from "@/authorization/testing/authorization-test-utils";
import {
  createMemoryCustomerModule,
  validCustomerAddressInput,
  validCustomerInput,
} from "../testing/customer-test-utils";

describe("CustomerAddress audit integration", () => {
  it("records customer address create and update audit entries", async () => {
    const auditLogRepository = new MemoryAuditLogRepository();
    const auditService = new AuditService({ auditLogRepository });
    const { customerService, customerAddressService } =
      createMemoryCustomerModule();
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
    const address = await customerAddressService.createCustomerAddress(
      TEST_STORE_A_ID,
      customer.id,
      validCustomerAddressInput(),
    );
    auditService.recordFromAuthContext(authContext, {
      entityType: "customer_address",
      entityId: address.id,
      action: "create",
      metadata: {
        customerId: address.customerId,
        label: address.label,
        isDefault: address.isDefault,
        countryCode: address.countryCode,
      },
    });

    await vi.waitFor(() => {
      expect(auditLogRepository.getAll()).toHaveLength(1);
    });

    const updated = await customerAddressService.updateCustomerAddress(
      TEST_STORE_A_ID,
      address.id,
      { label: "Office" },
    );
    auditService.recordFromAuthContext(authContext, {
      entityType: "customer_address",
      entityId: updated.id,
      action: "update",
      metadata: {
        customerId: updated.customerId,
        label: updated.label,
        isDefault: updated.isDefault,
        countryCode: updated.countryCode,
      },
    });

    await vi.waitFor(() => {
      expect(auditLogRepository.getAll()).toHaveLength(2);
    });

    expect(auditLogRepository.getAll()[0]).toMatchObject({
      entityType: "customer_address",
      action: "create",
      storeId: TEST_STORE_A_ID,
      userId: user.id,
    });
    expect(auditLogRepository.getAll()[1]).toMatchObject({
      entityType: "customer_address",
      action: "update",
    });

    expect(tokens.accessToken).toBeTruthy();
  });
});
