import { describe, expect, it, vi } from "vitest";

import { MemoryAuditLogRepository } from "@/audit/repositories/memory-audit-log.repository";
import { AuditService } from "@/audit/services/audit.service";
import {
  createMemoryNotificationModule,
  TEST_STORE_A_ID,
  validTestEmailInput,
} from "../../testing/notification-test-utils";
import { EMAIL_SIMULATE_FAILURE_KEY } from "../providers/console-email.provider";

describe("Email notification audit integration", () => {
  it("records email_notification send audit entries on success", async () => {
    const auditLogRepository = new MemoryAuditLogRepository();
    const auditService = new AuditService({ auditLogRepository });
    const module = createMemoryNotificationModule();

    const notification = await module.notificationService.sendTestEmailNotification(
      validTestEmailInput(),
    );

    auditService.record({
      storeId: TEST_STORE_A_ID,
      userId: "user-id",
      sessionId: "session-id",
      entityType: "email_notification",
      entityId: notification.id,
      action: "send",
      metadata: {
        notificationId: notification.id,
        subject: notification.subject,
        status: notification.status,
      },
    });

    await vi.waitFor(() => {
      expect(auditLogRepository.getAll()).toHaveLength(1);
    });

    expect(auditLogRepository.getAll()[0]).toMatchObject({
      entityType: "email_notification",
      action: "send",
    });
  });

  it("records email_notification fail audit entries on provider failure", async () => {
    const auditLogRepository = new MemoryAuditLogRepository();
    const auditService = new AuditService({ auditLogRepository });
    const module = createMemoryNotificationModule();

    const notification = await module.notificationService.sendTestEmailNotification(
      validTestEmailInput({
        metadata: { [EMAIL_SIMULATE_FAILURE_KEY]: true },
      }),
    );

    auditService.record({
      storeId: TEST_STORE_A_ID,
      userId: "user-id",
      sessionId: "session-id",
      entityType: "email_notification",
      entityId: notification.id,
      action: "fail",
      metadata: {
        notificationId: notification.id,
        status: notification.status,
      },
    });

    await vi.waitFor(() => {
      expect(auditLogRepository.getAll()).toHaveLength(1);
    });

    expect(notification.status).toBe("failed");
    expect(auditLogRepository.getAll()[0]).toMatchObject({
      entityType: "email_notification",
      action: "fail",
    });
  });
});
