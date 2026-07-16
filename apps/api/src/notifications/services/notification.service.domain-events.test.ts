import { describe, expect, it, vi } from "vitest";

import { createTestDomainEventPublisher } from "@/domain-events/testing/domain-events-test-utils";
import { EMAIL_SIMULATE_FAILURE_KEY } from "../email/providers/console-email.provider";
import {
  createMemoryNotificationModule,
  TEST_STORE_A_ID,
  validNotificationInput,
} from "../testing/notification-test-utils";

describe("NotificationService domain events", () => {
  it("emits notification.created and notification.sent on success", async () => {
    const { dispatcher, publisher } = createTestDomainEventPublisher();
    const createdHandler = vi.fn();
    const sentHandler = vi.fn();
    dispatcher.subscribe("notification.created", createdHandler);
    dispatcher.subscribe("notification.sent", sentHandler);

    const module = createMemoryNotificationModule({
      domainEventPublisher: publisher,
    });
    const notification = await module.notificationService.createNotification(
      validNotificationInput(),
    );

    await vi.waitFor(() => {
      expect(createdHandler).toHaveBeenCalledOnce();
      expect(sentHandler).toHaveBeenCalledOnce();
    });

    expect(createdHandler.mock.calls[0]?.[0]).toMatchObject({
      eventType: "notification.created",
      aggregateId: notification.id,
      storeId: TEST_STORE_A_ID,
    });
    expect(sentHandler.mock.calls[0]?.[0]).toMatchObject({
      eventType: "notification.sent",
      aggregateId: notification.id,
    });
  });

  it("emits notification.created and notification.failed on provider failure", async () => {
    const { dispatcher, publisher } = createTestDomainEventPublisher();
    const createdHandler = vi.fn();
    const failedHandler = vi.fn();
    dispatcher.subscribe("notification.created", createdHandler);
    dispatcher.subscribe("notification.failed", failedHandler);

    const module = createMemoryNotificationModule({
      domainEventPublisher: publisher,
    });
    const notification = await module.notificationService.createNotification(
      validNotificationInput({
        metadata: { [EMAIL_SIMULATE_FAILURE_KEY]: true },
      }),
    );

    await vi.waitFor(() => {
      expect(createdHandler).toHaveBeenCalledOnce();
      expect(failedHandler).toHaveBeenCalledOnce();
    });

    expect(notification.status).toBe("failed");
    expect(failedHandler.mock.calls[0]?.[0]).toMatchObject({
      eventType: "notification.failed",
      aggregateId: notification.id,
    });
  });
});
