import { describe, expect, it, vi } from "vitest";

import { createTestDomainEventPublisher } from "@/domain-events/testing/domain-events-test-utils";
import {
  createMemoryNotificationModule,
  TEST_STORE_A_ID,
  TEST_USER_A_ID,
  validInAppNotificationInput,
} from "../../testing/notification-test-utils";

describe("InAppNotificationService domain events", () => {
  it("publishes in-app-notification.read when marking as read", async () => {
    const { dispatcher, publisher } = createTestDomainEventPublisher();
    const readHandler = vi.fn();
    dispatcher.subscribe("in-app-notification.read", readHandler);

    const module = createMemoryNotificationModule({
      domainEventPublisher: publisher,
    });

    const created = await module.notificationService.createNotification(
      validInAppNotificationInput(),
    );

    await module.inAppNotificationService.markAsRead(created.id, {
      storeId: TEST_STORE_A_ID,
      userId: TEST_USER_A_ID,
    });

    await vi.waitFor(() => {
      expect(readHandler).toHaveBeenCalledOnce();
    });

    expect(readHandler.mock.calls[0]?.[0]).toMatchObject({
      eventType: "in-app-notification.read",
      aggregateType: "in_app_notification",
      aggregateId: created.id,
    });
  });

  it("publishes in-app-notification.unread when marking as unread", async () => {
    const { dispatcher, publisher } = createTestDomainEventPublisher();
    const unreadHandler = vi.fn();
    dispatcher.subscribe("in-app-notification.unread", unreadHandler);

    const module = createMemoryNotificationModule({
      domainEventPublisher: publisher,
    });

    const created = await module.notificationService.createNotification(
      validInAppNotificationInput(),
    );

    await module.inAppNotificationService.markAsRead(created.id, {
      storeId: TEST_STORE_A_ID,
      userId: TEST_USER_A_ID,
    });

    await module.inAppNotificationService.markAsUnread(created.id, {
      storeId: TEST_STORE_A_ID,
      userId: TEST_USER_A_ID,
    });

    await vi.waitFor(() => {
      expect(unreadHandler).toHaveBeenCalledOnce();
    });

    expect(unreadHandler.mock.calls[0]?.[0]).toMatchObject({
      eventType: "in-app-notification.unread",
      aggregateType: "in_app_notification",
      aggregateId: created.id,
    });
  });
});
