import { describe, expect, it, vi } from "vitest";

import { MemoryAuditLogRepository } from "@/audit/repositories/memory-audit-log.repository";
import { AuditService } from "@/audit/services/audit.service";
import {
  createMemoryAuthorizationService,
  registerStaffUser,
} from "@/authorization/testing/authorization-test-utils";
import {
  createMemoryNotificationPreferenceModule,
  TEST_STORE_A_ID,
  validUpdateNotificationPreferenceInput,
} from "../testing/notification-preference-test-utils";

describe("Notification preference audit integration", () => {
  it("records notification_preference update audit entries", async () => {
    const auditLogRepository = new MemoryAuditLogRepository();
    const auditService = new AuditService({ auditLogRepository });
    const module = createMemoryNotificationPreferenceModule();
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
      permission: "notifications:write" as const,
    };

    const preference = await module.notificationPreferenceService.updatePreference(
      TEST_STORE_A_ID,
      user.id,
      "return_updates",
      validUpdateNotificationPreferenceInput({ inAppEnabled: false }),
    );

    auditService.recordFromAuthContext(authContext, {
      entityType: "notification_preference",
      entityId: preference.id,
      action: "update",
      metadata: {
        notificationType: preference.notificationType,
        emailEnabled: preference.emailEnabled,
        smsEnabled: preference.smsEnabled,
        inAppEnabled: preference.inAppEnabled,
      },
    });

    await vi.waitFor(() => {
      expect(auditLogRepository.getAll()).toHaveLength(1);
    });

    expect(auditLogRepository.getAll()[0]).toMatchObject({
      entityType: "notification_preference",
      action: "update",
    });
  });
});
