import { describe, expect, it, vi } from "vitest";

import { MemoryAuditLogRepository } from "@/audit/repositories/memory-audit-log.repository";
import { AuditService } from "@/audit/services/audit.service";
import { auditService } from "@/audit/services";
import {
  createDomainNotificationTestModule,
  TEST_ORDER_ID,
  TEST_STORE_A_ID,
} from "../testing/domain-notification-test-utils";
import { validNotificationInput } from "../../testing/notification-test-utils";
import {
  DOMAIN_NOTIFICATION_SYSTEM_SESSION_ID,
  DOMAIN_NOTIFICATION_SYSTEM_USER_ID,
} from "./domain-notification.service";

describe("DomainNotificationService audit integration", () => {
  it("records domain_notification dispatch audit entries for immediate notifications", async () => {
    const auditLogRepository = new MemoryAuditLogRepository();
    const testAuditService = new AuditService({ auditLogRepository });
    const recordSpy = vi
      .spyOn(auditService, "recordBestEffort")
      .mockImplementation((input) => testAuditService.recordBestEffort(input));

    const module = createDomainNotificationTestModule({
      config: { "order.confirmed": { email: true, defer: false } },
    });

    const result = await module.domainNotificationService.dispatch({
      storeId: TEST_STORE_A_ID,
      sourceEventType: "order.confirmed",
      sourceAggregateId: TEST_ORDER_ID,
      notifications: [
        validNotificationInput({
          subject: "Order confirmed",
          body: "Your order is confirmed.",
        }),
      ],
    });

    await vi.waitFor(() => {
      expect(auditLogRepository.getAll()).toHaveLength(1);
    });

    expect(auditLogRepository.getAll()[0]).toMatchObject({
      storeId: TEST_STORE_A_ID,
      userId: DOMAIN_NOTIFICATION_SYSTEM_USER_ID,
      sessionId: DOMAIN_NOTIFICATION_SYSTEM_SESSION_ID,
      entityType: "domain_notification",
      entityId: result.dispatches[0]?.notificationId,
      action: "dispatch",
      metadata: {
        sourceEventType: "order.confirmed",
        sourceAggregateId: TEST_ORDER_ID,
        channel: "email",
        deferred: false,
      },
    });

    recordSpy.mockRestore();
  });

  it("records domain_notification dispatch audit entries for deferred jobs", async () => {
    const auditLogRepository = new MemoryAuditLogRepository();
    const testAuditService = new AuditService({ auditLogRepository });
    const recordSpy = vi
      .spyOn(auditService, "recordBestEffort")
      .mockImplementation((input) => testAuditService.recordBestEffort(input));

    const module = createDomainNotificationTestModule({
      config: { "shipment.shipped": { email: true, defer: true } },
    });

    const result = await module.domainNotificationService.dispatch({
      storeId: TEST_STORE_A_ID,
      sourceEventType: "shipment.shipped",
      sourceAggregateId: "shipment-id",
      notifications: [
        validNotificationInput({
          subject: "Shipment shipped",
          body: "Your shipment is on the way.",
        }),
      ],
    });

    await vi.waitFor(() => {
      expect(auditLogRepository.getAll()).toHaveLength(1);
    });

    expect(auditLogRepository.getAll()[0]).toMatchObject({
      entityType: "domain_notification",
      entityId: result.dispatches[0]?.jobId,
      action: "dispatch",
      metadata: {
        sourceEventType: "shipment.shipped",
        deferred: true,
        jobId: result.dispatches[0]?.jobId,
      },
    });

    recordSpy.mockRestore();
  });
});
