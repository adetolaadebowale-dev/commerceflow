import { describe, expect, it, vi } from "vitest";

import { MemoryAuditLogRepository } from "@/audit/repositories/memory-audit-log.repository";
import { AuditService } from "@/audit/services/audit.service";
import {
  createMemoryAuthorizationService,
  registerStaffUser,
} from "@/authorization/testing/authorization-test-utils";
import {
  createMemoryStoreAdministrationModule,
  seedStore,
  TEST_ORGANIZATION_A_ID,
  TEST_STORE_A_ID,
} from "../testing/store-administration-test-utils";

describe("Store administration audit integration", () => {
  it("records store update_settings audit entries", async () => {
    const auditLogRepository = new MemoryAuditLogRepository();
    const auditService = new AuditService({ auditLogRepository });
    const module = createMemoryStoreAdministrationModule();
    seedStore(module.storeAdministrationRepository);
    const { authService, storeMemberRepository } =
      createMemoryAuthorizationService();
    const { user } = await registerStaffUser(authService);

    storeMemberRepository.seedMember({
      storeId: TEST_STORE_A_ID,
      userId: user.id,
      role: "manager",
      organizationId: TEST_ORGANIZATION_A_ID,
    });

    const authContext = {
      userId: user.id,
      sessionId: "session-id",
      storeId: TEST_STORE_A_ID,
      storeRole: "manager" as const,
      permission: "stores:write" as const,
    };

    const store = await module.storeAdministrationService.updateStoreSettings(
      TEST_STORE_A_ID,
      { defaultCurrency: "EUR", defaultTimezone: "Europe/Berlin" },
    );

    auditService.recordFromAuthContext(authContext, {
      entityType: "store",
      entityId: store.id,
      action: "update_settings",
      metadata: {
        name: store.name,
        slug: store.slug,
        settings: store.settings,
      },
    });

    await vi.waitFor(() => {
      expect(auditLogRepository.getAll()).toHaveLength(1);
    });

    expect(auditLogRepository.getAll()[0]).toMatchObject({
      storeId: TEST_STORE_A_ID,
      entityType: "store",
      action: "update_settings",
      metadata: expect.objectContaining({
        settings: expect.objectContaining({ defaultCurrency: "EUR" }),
      }),
    });
  });
});
