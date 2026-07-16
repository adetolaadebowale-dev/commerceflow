import { describe, expect, it, vi } from "vitest";

import { MemoryAuditLogRepository } from "@/audit/repositories/memory-audit-log.repository";
import { AuditService } from "@/audit/services/audit.service";
import {
  createMemoryNotificationModule,
  TEST_STORE_A_ID,
  TEST_USER_A_ID,
  validInAppNotificationInput,
} from "../../testing/notification-test-utils";

describe("In-app notification audit integration", () => {
  it("records in_app_notification read audit entries", async () => {
    const auditLogRepository = new MemoryAuditLogRepository();
    const auditService = new AuditService({ auditLogRepository });
    const module = createMemoryNotificationModule();

    const created = await module.notificationService.createNotification(
      validInAppNotificationInput(),
    );

    const notification = await module.inAppNotificationService.markAsRead(
      created.id,
      {
        storeId: TEST_STORE_A_ID,
        userId: TEST_USER_A_ID,
      },
    );

    auditService.record({
      storeId: TEST_STORE_A_ID,
      userId: TEST_USER_A_ID,
      sessionId: "session-id",
      entityType: "in_app_notification",
      entityId: notification.id,
      action: "read",
      metadata: {
        notificationId: notification.id,
        userId: notification.userId,
        isRead: notification.isRead,
      },
    });

    await vi.waitFor(() => {
      expect(auditLogRepository.getAll()).toHaveLength(1);
    });

    expect(auditLogRepository.getAll()[0]).toMatchObject({
      entityType: "in_app_notification",
      action: "read",
    });
  });

  it("records in_app_notification unread audit entries", async () => {
    const auditLogRepository = new MemoryAuditLogRepository();
    const auditService = new AuditService({ auditLogRepository });
    const module = createMemoryNotificationModule();

    const created = await module.notificationService.createNotification(
      validInAppNotificationInput(),
    );

    await module.inAppNotificationService.markAsRead(created.id, {
      storeId: TEST_STORE_A_ID,
      userId: TEST_USER_A_ID,
    });

    const notification = await module.inAppNotificationService.markAsUnread(
      created.id,
      {
        storeId: TEST_STORE_A_ID,
        userId: TEST_USER_A_ID,
      },
    );

    auditService.record({
      storeId: TEST_STORE_A_ID,
      userId: TEST_USER_A_ID,
      sessionId: "session-id",
      entityType: "in_app_notification",
      entityId: notification.id,
      action: "unread",
      metadata: {
        notificationId: notification.id,
        userId: notification.userId,
        isRead: notification.isRead,
      },
    });

    await vi.waitFor(() => {
      expect(auditLogRepository.getAll()).toHaveLength(1);
    });

    expect(auditLogRepository.getAll()[0]).toMatchObject({
      entityType: "in_app_notification",
      action: "unread",
    });
  });
});
