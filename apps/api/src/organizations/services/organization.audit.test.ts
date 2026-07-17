import { describe, expect, it, vi } from "vitest";

import { MemoryAuditLogRepository } from "@/audit/repositories/memory-audit-log.repository";
import { AuditService } from "@/audit/services/audit.service";
import {
  createMemoryAuthorizationService,
  registerStaffUser,
} from "@/authorization/testing/authorization-test-utils";
import {
  createMemoryOrganizationModule,
  seedOrganizationWithStore,
  TEST_ORGANIZATION_A_ID,
  TEST_STORE_A_ID,
} from "../testing/organization-test-utils";

describe("Organization audit integration", () => {
  it("records organization update audit entries", async () => {
    const auditLogRepository = new MemoryAuditLogRepository();
    const auditService = new AuditService({ auditLogRepository });
    const module = createMemoryOrganizationModule();
    seedOrganizationWithStore(module.organizationRepository);
    const { authService, storeMemberRepository } =
      createMemoryAuthorizationService();
    const { user } = await registerStaffUser(authService);

    storeMemberRepository.seedMember({
      storeId: TEST_STORE_A_ID,
      userId: user.id,
      role: "admin",
      organizationId: TEST_ORGANIZATION_A_ID,
    });

    const authContext = {
      userId: user.id,
      sessionId: "session-id",
      organizationId: TEST_ORGANIZATION_A_ID,
      organizationRole: "admin" as const,
      permission: "organizations:write" as const,
    };

    const organization = await module.organizationService.updateOrganization(
      TEST_ORGANIZATION_A_ID,
      { name: "Updated Organization" },
    );

    auditService.recordFromOrganizationAuthContext(authContext, {
      entityType: "organization",
      entityId: organization.id,
      action: "update",
      metadata: {
        name: organization.name,
        slug: organization.slug,
      },
    });

    await vi.waitFor(() => {
      expect(auditLogRepository.getAll()).toHaveLength(1);
    });

    expect(auditLogRepository.getAll()[0]).toMatchObject({
      storeId: null,
      entityType: "organization",
      action: "update",
      metadata: expect.objectContaining({
        organizationId: TEST_ORGANIZATION_A_ID,
      }),
    });
  });
});
