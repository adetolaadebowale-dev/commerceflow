import { describe, expect, it } from "vitest";

import {
  createMemoryNotificationModule,
  TEST_STORE_A_ID,
  TEST_STORE_B_ID,
  TEST_USER_A_ID,
  TEST_USER_B_ID,
  validInAppNotificationInput,
} from "../../testing/notification-test-utils";

describe("InAppNotificationService", () => {
  it("lists in-app notifications for a user with pagination", async () => {
    const module = createMemoryNotificationModule();

    for (let index = 0; index < 3; index += 1) {
      await module.notificationService.createNotification(
        validInAppNotificationInput({
          title: `Notification ${index + 1}`,
        }),
      );
    }

    const result = await module.inAppNotificationService.listInAppNotifications({
      storeId: TEST_STORE_A_ID,
      userId: TEST_USER_A_ID,
      page: 1,
      limit: 2,
    });

    expect(result.total).toBe(3);
    expect(result.items).toHaveLength(2);
    expect(result.items.every((item) => item.userId === TEST_USER_A_ID)).toBe(
      true,
    );
  });

  it("filters unread in-app notifications only", async () => {
    const module = createMemoryNotificationModule();

    const first = await module.notificationService.createNotification(
      validInAppNotificationInput({ title: "Unread" }),
    );
    const second = await module.notificationService.createNotification(
      validInAppNotificationInput({ title: "Read" }),
    );

    await module.inAppNotificationService.markAsRead(second.id, {
      storeId: TEST_STORE_A_ID,
      userId: TEST_USER_A_ID,
    });

    const unreadOnly = await module.inAppNotificationService.listInAppNotifications(
      {
        storeId: TEST_STORE_A_ID,
        userId: TEST_USER_A_ID,
        page: 1,
        limit: 20,
        unreadOnly: true,
      },
    );

    expect(unreadOnly.total).toBe(1);
    expect(unreadOnly.items[0]?.id).toBe(first.id);
    expect(unreadOnly.items[0]?.isRead).toBe(false);
  });

  it("marks notifications as read and unread", async () => {
    const module = createMemoryNotificationModule();
    const created = await module.notificationService.createNotification(
      validInAppNotificationInput(),
    );

    const read = await module.inAppNotificationService.markAsRead(created.id, {
      storeId: TEST_STORE_A_ID,
      userId: TEST_USER_A_ID,
    });

    expect(read.isRead).toBe(true);
    expect(read.readAt).toBeDefined();

    const unread = await module.inAppNotificationService.markAsUnread(created.id, {
      storeId: TEST_STORE_A_ID,
      userId: TEST_USER_A_ID,
    });

    expect(unread.isRead).toBe(false);
    expect(unread.readAt).toBeUndefined();
  });

  it("returns a single in-app notification by id", async () => {
    const module = createMemoryNotificationModule();
    const created = await module.notificationService.createNotification(
      validInAppNotificationInput({ title: "Single notification" }),
    );

    const notification = await module.inAppNotificationService.getInAppNotification(
      created.id,
      {
        storeId: TEST_STORE_A_ID,
        userId: TEST_USER_A_ID,
      },
    );

    expect(notification.title).toBe("Single notification");
    expect(notification.isRead).toBe(false);
  });

  it("isolates in-app notifications by store and user", async () => {
    const module = createMemoryNotificationModule();
    const notification = await module.notificationService.createNotification(
      validInAppNotificationInput(),
    );

    await expect(
      module.inAppNotificationService.getInAppNotification(notification.id, {
        storeId: TEST_STORE_B_ID,
        userId: TEST_USER_A_ID,
      }),
    ).rejects.toMatchObject({ status: 404 });

    await expect(
      module.inAppNotificationService.getInAppNotification(notification.id, {
        storeId: TEST_STORE_A_ID,
        userId: TEST_USER_B_ID,
      }),
    ).rejects.toMatchObject({ status: 404 });
  });
});
