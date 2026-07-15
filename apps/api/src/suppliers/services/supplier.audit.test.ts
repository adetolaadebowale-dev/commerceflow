import { describe, expect, it, vi } from "vitest";

import { MemoryAuditLogRepository } from "@/audit/repositories/memory-audit-log.repository";
import { AuditService } from "@/audit/services/audit.service";
import {
  createMemoryAuthorizationService,
  registerStaffUser,
  TEST_STORE_A_ID,
} from "@/authorization/testing/authorization-test-utils";
import {
  createMemorySupplierModule,
  validSupplierInput,
} from "../testing/supplier-test-utils";

describe("Supplier audit integration", () => {
  it("records supplier and contact audit entries", async () => {
    const auditLogRepository = new MemoryAuditLogRepository();
    const auditService = new AuditService({ auditLogRepository });
    const module = createMemorySupplierModule();
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
      permission: "suppliers:write" as const,
    };

    const supplier = await module.supplierService.createSupplier(
      validSupplierInput({ code: "AUDIT" }),
    );

    auditService.recordFromAuthContext(authContext, {
      entityType: "supplier",
      entityId: supplier.id,
      action: "create",
      metadata: {
        code: supplier.code,
        name: supplier.name,
        status: supplier.status,
      },
    });

    const contact = await module.supplierService.createContact(supplier.id, {
      storeId: TEST_STORE_A_ID,
      firstName: "Jane",
      lastName: "Doe",
      isPrimary: true,
    });

    auditService.recordFromAuthContext(authContext, {
      entityType: "supplier_contact",
      entityId: contact.id,
      action: "create",
      metadata: {
        supplierId: supplier.id,
        firstName: contact.firstName,
        lastName: contact.lastName,
        isPrimary: contact.isPrimary,
      },
    });

    await vi.waitFor(() => {
      expect(auditLogRepository.getAll()).toHaveLength(2);
    });

    expect(auditLogRepository.getAll()[0]).toMatchObject({
      entityType: "supplier",
      action: "create",
    });
    expect(auditLogRepository.getAll()[1]).toMatchObject({
      entityType: "supplier_contact",
      action: "create",
    });
  });
});
