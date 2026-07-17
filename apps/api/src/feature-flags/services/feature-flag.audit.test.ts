import { describe, expect, it, vi } from "vitest";

import { MemoryAuditLogRepository } from "@/audit/repositories/memory-audit-log.repository";
import { AuditService } from "@/audit/services/audit.service";
import {
  createMemoryAuthorizationService,
  registerStaffUser,
} from "@/authorization/testing/authorization-test-utils";
import {
  createMemoryFeatureFlagModule,
  TEST_STORE_A_ID,
  validUpsertInput,
} from "../testing/feature-flag-test-utils";

describe("FeatureFlag audit integration", () => {
  it("records feature_flag update audit entries", async () => {
    const auditLogRepository = new MemoryAuditLogRepository();
    const auditService = new AuditService({ auditLogRepository });
    const { featureFlagService } = createMemoryFeatureFlagModule();
    const { authService, storeMemberRepository } =
      createMemoryAuthorizationService();
    const { user } = await registerStaffUser(authService);

    storeMemberRepository.seedMember({
      storeId: TEST_STORE_A_ID,
      userId: user.id,
      role: "admin",
    });

    const authContext = {
      userId: user.id,
      sessionId: "session-id",
      storeId: TEST_STORE_A_ID,
      storeRole: "admin" as const,
      permission: "feature-flags:write" as const,
    };

    const featureFlag = await featureFlagService.upsertFeatureFlag(
      "audit-flag",
      validUpsertInput({ enabled: true }),
    );

    auditService.recordFromAuthContext(authContext, {
      entityType: "feature_flag",
      entityId: featureFlag.id,
      action: "update",
      metadata: {
        featureFlagId: featureFlag.id,
        key: featureFlag.key,
        scope: featureFlag.scope,
        enabled: featureFlag.enabled,
      },
    });

    await vi.waitFor(() => {
      expect(auditLogRepository.getAll()).toHaveLength(1);
    });

    expect(auditLogRepository.getAll()[0]).toMatchObject({
      entityType: "feature_flag",
      entityId: featureFlag.id,
      action: "update",
      metadata: {
        key: "audit-flag",
        scope: "store",
        enabled: true,
      },
    });
  });
});
