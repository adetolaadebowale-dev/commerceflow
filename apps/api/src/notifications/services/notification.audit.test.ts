import { describe, expect, it, vi } from "vitest";

import { MemoryAuditLogRepository } from "@/audit/repositories/memory-audit-log.repository";
import { AuditService } from "@/audit/services/audit.service";
import {
  createMemoryAuthorizationService,
  registerStaffUser,
  TEST_STORE_A_ID,
} from "@/authorization/testing/authorization-test-utils";
import { NOTIFICATION_SIMULATE_FAILURE_KEY } from "../providers/console-notification.provider";
import {
  createMemoryNotificationModule,
  validNotificationInput,
} from "../testing/notification-test-utils";

describe("Notification audit integration", () => {
  it("records create and send audit entries on successful delivery", async () => {
    const auditLogRepository = new MemoryAuditLogRepository();
    const auditService = new AuditService({ auditLogRepository });
    const module = createMemoryNotificationModule();
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

    const notification = await module.notificationService.createNotification(
      validNotificationInput(),
    );

    auditService.recordFromAuthContext(authContext, {
      entityType: "notification",
      entityId: notification.id,
      action: "create",
      metadata: {
        channel: notification.channel,
        status: notification.status,
      },
    });

    auditService.recordFromAuthContext(authContext, {
      entityType: "notification",
      entityId: notification.id,
      action: "send",
      metadata: {
        channel: notification.channel,
        status: notification.status,
      },
    });

    await vi.waitFor(() => {
      expect(auditLogRepository.getAll()).toHaveLength(2);
    });

    expect(auditLogRepository.getAll()[0]).toMatchObject({
      entityType: "notification",
      action: "create",
    });
    expect(auditLogRepository.getAll()[1]).toMatchObject({
      entityType: "notification",
      action: "send",
    });
  });

  it("records create and fail audit entries on provider failure", async () => {
    const auditLogRepository = new MemoryAuditLogRepository();
    const auditService = new AuditService({ auditLogRepository });
    const module = createMemoryNotificationModule();

    const authContext = {
      userId: "user-id",
      sessionId: "session-id",
      storeId: TEST_STORE_A_ID,
      storeRole: "manager" as const,
      permission: "notifications:write" as const,
    };

    const notification = await module.notificationService.createNotification(
      validNotificationInput({
        metadata: { [NOTIFICATION_SIMULATE_FAILURE_KEY]: true },
      }),
    );

    auditService.recordFromAuthContext(authContext, {
      entityType: "notification",
      entityId: notification.id,
      action: "create",
      metadata: {
        channel: notification.channel,
        status: "pending",
      },
    });

    auditService.recordFromAuthContext(authContext, {
      entityType: "notification",
      entityId: notification.id,
      action: "fail",
      metadata: {
        channel: notification.channel,
        status: notification.status,
      },
    });

    await vi.waitFor(() => {
      expect(auditLogRepository.getAll()).toHaveLength(2);
    });

    expect(auditLogRepository.getAll()[1]).toMatchObject({
      entityType: "notification",
      action: "fail",
    });
  });
});
