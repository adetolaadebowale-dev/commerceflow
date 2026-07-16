import { describe, expect, it, vi } from "vitest";

import { createTestDomainEventPublisher } from "@/domain-events/testing/domain-events-test-utils";
import { SMS_SIMULATE_FAILURE_KEY } from "../sms/providers/console-sms.provider";
import {
  createMemoryNotificationModule,
  TEST_STORE_B_ID,
  validSmsNotificationInput,
  validTestSmsInput,
} from "../testing/notification-test-utils";

describe("NotificationService SMS integration", () => {
  it("dispatches SMS channel notifications through the SMS provider", async () => {
    const module = createMemoryNotificationModule();
    const notification = await module.notificationService.createNotification(
      validSmsNotificationInput(),
    );

    expect(notification.status).toBe("sent");
    expect(module.memorySmsProvider.getDeliveries()).toHaveLength(1);
    expect(module.memoryProvider.getDeliveries()).toHaveLength(0);
  });

  it("sends test SMS notifications through the dedicated helper", async () => {
    const module = createMemoryNotificationModule();
    const notification = await module.notificationService.sendTestSmsNotification(
      validTestSmsInput(),
    );

    expect(notification.channel).toBe("sms");
    expect(notification.status).toBe("sent");
    expect(module.memorySmsProvider.getDeliveries()[0]?.message.to.phone).toBe(
      "+15551234567",
    );
  });

  it("marks SMS notifications failed when the SMS provider fails", async () => {
    const module = createMemoryNotificationModule();
    const notification = await module.notificationService.createNotification(
      validSmsNotificationInput({
        metadata: { [SMS_SIMULATE_FAILURE_KEY]: true },
      }),
    );

    expect(notification.status).toBe("failed");
  });

  it("isolates SMS notifications by store", async () => {
    const module = createMemoryNotificationModule();
    const notification = await module.notificationService.sendTestSmsNotification(
      validTestSmsInput(),
    );

    await expect(
      module.notificationService.getNotification(TEST_STORE_B_ID, notification.id),
    ).rejects.toMatchObject({
      status: 404,
    });
  });
});

describe("NotificationService SMS domain events", () => {
  it("emits sms.sent alongside notification.sent for SMS channel", async () => {
    const { dispatcher, publisher } = createTestDomainEventPublisher();
    const smsSentHandler = vi.fn();
    const notificationSentHandler = vi.fn();
    dispatcher.subscribe("sms.sent", smsSentHandler);
    dispatcher.subscribe("notification.sent", notificationSentHandler);

    const module = createMemoryNotificationModule({
      domainEventPublisher: publisher,
    });

    await module.notificationService.sendTestSmsNotification(validTestSmsInput());

    await vi.waitFor(() => {
      expect(smsSentHandler).toHaveBeenCalledOnce();
      expect(notificationSentHandler).toHaveBeenCalledOnce();
    });
  });

  it("emits sms.failed alongside notification.failed for SMS channel", async () => {
    const { dispatcher, publisher } = createTestDomainEventPublisher();
    const smsFailedHandler = vi.fn();
    const notificationFailedHandler = vi.fn();
    dispatcher.subscribe("sms.failed", smsFailedHandler);
    dispatcher.subscribe("notification.failed", notificationFailedHandler);

    const module = createMemoryNotificationModule({
      domainEventPublisher: publisher,
    });

    await module.notificationService.sendTestSmsNotification(
      validTestSmsInput({
        metadata: { [SMS_SIMULATE_FAILURE_KEY]: true },
      }),
    );

    await vi.waitFor(() => {
      expect(smsFailedHandler).toHaveBeenCalledOnce();
      expect(notificationFailedHandler).toHaveBeenCalledOnce();
    });
  });
});
