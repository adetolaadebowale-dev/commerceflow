import { describe, expect, it, vi } from "vitest";

import { createTestDomainEventPublisher } from "@/domain-events/testing/domain-events-test-utils";
import {
  createMemoryNotificationModule,
  TEST_STORE_B_ID,
  validNotificationInput,
  validTestEmailInput,
} from "../testing/notification-test-utils";
import { EMAIL_SIMULATE_FAILURE_KEY } from "../email/providers/console-email.provider";

describe("NotificationService email integration", () => {
  it("dispatches email channel notifications through the email provider", async () => {
    const module = createMemoryNotificationModule();
    const notification = await module.notificationService.createNotification(
      validNotificationInput(),
    );

    expect(notification.status).toBe("sent");
    expect(module.memoryEmailProvider.getDeliveries()).toHaveLength(1);
    expect(module.memoryProvider.getDeliveries()).toHaveLength(0);
  });

  it("sends test email notifications through the dedicated helper", async () => {
    const module = createMemoryNotificationModule();
    const notification = await module.notificationService.sendTestEmailNotification(
      validTestEmailInput(),
    );

    expect(notification.channel).toBe("email");
    expect(notification.status).toBe("sent");
    expect(module.memoryEmailProvider.getDeliveries()[0]?.message.to.email).toBe(
      "customer@example.com",
    );
  });

  it("marks email notifications failed when the email provider fails", async () => {
    const module = createMemoryNotificationModule();
    const notification = await module.notificationService.createNotification(
      validNotificationInput({
        metadata: { [EMAIL_SIMULATE_FAILURE_KEY]: true },
      }),
    );

    expect(notification.status).toBe("failed");
  });

  it("still uses generic providers for non-email channels", async () => {
    const module = createMemoryNotificationModule();
    const notification = await module.notificationService.createNotification(
      validNotificationInput({
        channel: "in_app",
        to: undefined,
      }),
    );

    expect(notification.status).toBe("sent");
    expect(module.memoryProvider.getDeliveries()).toHaveLength(1);
    expect(module.memoryEmailProvider.getDeliveries()).toHaveLength(0);
  });

  it("isolates email notifications by store", async () => {
    const module = createMemoryNotificationModule();
    const notification = await module.notificationService.sendTestEmailNotification(
      validTestEmailInput(),
    );

    await expect(
      module.notificationService.getNotification(TEST_STORE_B_ID, notification.id),
    ).rejects.toMatchObject({
      status: 404,
    });
  });
});

describe("NotificationService email domain events", () => {
  it("emits email.sent alongside notification.sent for email channel", async () => {
    const { dispatcher, publisher } = createTestDomainEventPublisher();
    const emailSentHandler = vi.fn();
    const notificationSentHandler = vi.fn();
    dispatcher.subscribe("email.sent", emailSentHandler);
    dispatcher.subscribe("notification.sent", notificationSentHandler);

    const module = createMemoryNotificationModule({
      domainEventPublisher: publisher,
    });

    await module.notificationService.sendTestEmailNotification(validTestEmailInput());

    await vi.waitFor(() => {
      expect(emailSentHandler).toHaveBeenCalledOnce();
      expect(notificationSentHandler).toHaveBeenCalledOnce();
    });
  });

  it("emits email.failed alongside notification.failed for email channel", async () => {
    const { dispatcher, publisher } = createTestDomainEventPublisher();
    const emailFailedHandler = vi.fn();
    const notificationFailedHandler = vi.fn();
    dispatcher.subscribe("email.failed", emailFailedHandler);
    dispatcher.subscribe("notification.failed", notificationFailedHandler);

    const module = createMemoryNotificationModule({
      domainEventPublisher: publisher,
    });

    await module.notificationService.sendTestEmailNotification(
      validTestEmailInput({
        metadata: { [EMAIL_SIMULATE_FAILURE_KEY]: true },
      }),
    );

    await vi.waitFor(() => {
      expect(emailFailedHandler).toHaveBeenCalledOnce();
      expect(notificationFailedHandler).toHaveBeenCalledOnce();
    });
  });
});
