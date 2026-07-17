import { describe, expect, it, vi } from "vitest";

import { createTestDomainEventPublisher } from "@/domain-events/testing/domain-events-test-utils";
import {
  createMemoryNotificationPreferenceModule,
  TEST_STORE_A_ID,
  TEST_USER_A_ID,
  validUpdateNotificationPreferenceInput,
} from "../testing/notification-preference-test-utils";

describe("NotificationPreferenceService domain events", () => {
  it("emits notification-preference.updated when preferences change", async () => {
    const { dispatcher, publisher } = createTestDomainEventPublisher();
    const handler = vi.fn();
    dispatcher.subscribe("notification-preference.updated", handler);

    const module = createMemoryNotificationPreferenceModule({
      domainEventPublisher: publisher,
    });

    const preference = await module.notificationPreferenceService.updatePreference(
      TEST_STORE_A_ID,
      TEST_USER_A_ID,
      "shipment_updates",
      validUpdateNotificationPreferenceInput({ smsEnabled: false }),
    );

    await vi.waitFor(() => {
      expect(handler).toHaveBeenCalledOnce();
    });

    expect(handler.mock.calls[0]?.[0]).toMatchObject({
      eventType: "notification-preference.updated",
      aggregateId: preference.id,
      storeId: TEST_STORE_A_ID,
      payload: {
        notificationType: "shipment_updates",
        userId: TEST_USER_A_ID,
      },
    });
  });
});
