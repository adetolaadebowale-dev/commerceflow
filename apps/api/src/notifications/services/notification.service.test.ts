import { describe, expect, it } from "vitest";

import { EMAIL_SIMULATE_FAILURE_KEY } from "../email/providers/console-email.provider";
import { NOTIFICATION_SIMULATE_FAILURE_KEY } from "../providers/console-notification.provider";
import { NOTIFICATION_ERROR_CODES } from "../errors";
import {
  createMemoryNotificationModule,
  TEST_STORE_A_ID,
  TEST_STORE_B_ID,
  validNotificationInput,
} from "../testing/notification-test-utils";

describe("NotificationService", () => {
  it("creates and sends an email notification via the email provider", async () => {
    const module = createMemoryNotificationModule();
    const notification = await module.notificationService.createNotification(
      validNotificationInput(),
    );

    expect(notification.status).toBe("sent");
    expect(notification.sentAt).toBeDefined();
    expect(module.memoryEmailProvider.getDeliveries()).toHaveLength(1);
    expect(module.memoryProvider.getDeliveries()).toHaveLength(0);
  });

  it("marks email notifications as failed when the email provider returns failure", async () => {
    const module = createMemoryNotificationModule();
    const notification = await module.notificationService.createNotification(
      validNotificationInput({
        metadata: { [EMAIL_SIMULATE_FAILURE_KEY]: true },
      }),
    );

    expect(notification.status).toBe("failed");
    expect(notification.sentAt).toBeUndefined();
  });

  it("marks non-email notifications as failed when the generic provider returns failure", async () => {
    const module = createMemoryNotificationModule();
    const notification = await module.notificationService.createNotification(
      validNotificationInput({
        channel: "in_app",
        to: undefined,
        metadata: { [NOTIFICATION_SIMULATE_FAILURE_KEY]: true },
      }),
    );

    expect(notification.status).toBe("failed");
    expect(notification.sentAt).toBeUndefined();
  });

  it("isolates notifications by store", async () => {
    const module = createMemoryNotificationModule();
    const notification = await module.notificationService.createNotification(
      validNotificationInput(),
    );

    await expect(
      module.notificationService.getNotification(TEST_STORE_B_ID, notification.id),
    ).rejects.toMatchObject({
      code: NOTIFICATION_ERROR_CODES.NOT_FOUND,
      status: 404,
    });
  });

  it("lists notifications for a store", async () => {
    const module = createMemoryNotificationModule();
    await module.notificationService.createNotification(validNotificationInput());
    await module.notificationService.createNotification(
      validNotificationInput({ channel: "sms", to: undefined, smsTo: { phone: "+15559876543" }, body: "SMS alert" }),
    );

    const result = await module.notificationService.listNotifications({
      storeId: TEST_STORE_A_ID,
      page: 1,
      limit: 20,
    });

    expect(result.total).toBe(2);
    expect(result.items).toHaveLength(2);
  });

  it("preserves pending record when status update fails after provider success", async () => {
    const module = createMemoryNotificationModule();
    const originalMarkSent =
      module.notificationRepository.markSent.bind(module.notificationRepository);

    module.notificationRepository.markSent = async () => {
      throw new Error("markSent failed");
    };

    await expect(
      module.notificationService.createNotification(validNotificationInput()),
    ).rejects.toMatchObject({
      code: NOTIFICATION_ERROR_CODES.REPOSITORY_ERROR,
      status: 500,
    });

    module.notificationRepository.markSent = originalMarkSent;

    const notifications = await module.notificationService.listNotifications({
      storeId: TEST_STORE_A_ID,
      page: 1,
      limit: 20,
    });

    expect(notifications.items).toHaveLength(1);
    expect(notifications.items[0]?.status).toBe("pending");
  });

  it("preserves pending record when markFailed fails after provider failure", async () => {
    const module = createMemoryNotificationModule();
    let callCount = 0;
    const originalMarkFailed =
      module.notificationRepository.markFailed.bind(module.notificationRepository);

    module.notificationRepository.markFailed = async (storeId, id) => {
      callCount += 1;
      if (callCount === 1) {
        throw new Error("markFailed failed");
      }

      return originalMarkFailed(storeId, id);
    };

    await expect(
      module.notificationService.createNotification(
        validNotificationInput({
          metadata: { [EMAIL_SIMULATE_FAILURE_KEY]: true },
        }),
      ),
    ).rejects.toMatchObject({
      code: NOTIFICATION_ERROR_CODES.REPOSITORY_ERROR,
      status: 500,
    });

    const notifications = await module.notificationService.listNotifications({
      storeId: TEST_STORE_A_ID,
      page: 1,
      limit: 20,
    });

    expect(notifications.items).toHaveLength(1);
    expect(notifications.items[0]?.status).toBe("pending");
  });
});
