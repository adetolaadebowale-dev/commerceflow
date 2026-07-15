import { describe, expect, it, vi } from "vitest";

import { MemoryAuditLogRepository } from "@/audit/repositories/memory-audit-log.repository";
import { AuditService } from "@/audit/services/audit.service";
import {
  createMemoryAuthorizationService,
  registerStaffUser,
  TEST_STORE_A_ID,
} from "@/authorization/testing/authorization-test-utils";
import {
  createMemoryTaxRateModule,
  validTaxRateInput,
} from "../testing/tax-rate-test-utils";

describe("Tax rate audit integration", () => {
  it("records tax rate create and lifecycle audit entries", async () => {
    const auditLogRepository = new MemoryAuditLogRepository();
    const auditService = new AuditService({ auditLogRepository });
    const module = createMemoryTaxRateModule();
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
      permission: "tax-rates:write" as const,
    };

    const taxRate = await module.taxRateService.createTaxRate(validTaxRateInput());

    auditService.recordFromAuthContext(authContext, {
      entityType: "tax_rate",
      entityId: taxRate.id,
      action: "create",
      metadata: {
        name: taxRate.name,
        percentage: taxRate.percentage,
        status: taxRate.status,
      },
    });

    const activated = await module.taxRateService.activateTaxRate(
      TEST_STORE_A_ID,
      taxRate.id,
    );

    auditService.recordFromAuthContext(authContext, {
      entityType: "tax_rate",
      entityId: activated.id,
      action: "activate",
      metadata: {
        name: activated.name,
        percentage: activated.percentage,
        status: activated.status,
      },
    });

    await vi.waitFor(() => {
      expect(auditLogRepository.getAll()).toHaveLength(2);
    });

    expect(auditLogRepository.getAll()[0]).toMatchObject({
      entityType: "tax_rate",
      action: "create",
    });
    expect(auditLogRepository.getAll()[1]).toMatchObject({
      entityType: "tax_rate",
      action: "activate",
    });
  });
});
