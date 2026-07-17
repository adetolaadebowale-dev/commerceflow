import { describe, expect, it } from "vitest";

import { NOTIFICATION_ERROR_CODES } from "../../errors";
import {
  createDomainNotificationTestModule,
  TEST_ORDER_ID,
  TEST_STORE_A_ID,
  TEST_STORE_B_ID,
  TEST_USER_A_ID,
} from "../testing/domain-notification-test-utils";
import {
  createMemoryNotificationModule,
  validNotificationInput,
} from "../../testing/notification-test-utils";
import { DomainNotificationService } from "./domain-notification.service";
import { getDomainNotificationConfig } from "../domain-notification-config";
import {
  createMemoryNotificationPreferenceModule,
  validUpdateNotificationPreferenceInput,
} from "@/notification-preferences/testing/notification-preference-test-utils";

describe("DomainNotificationService", () => {
  it("creates notifications immediately when defer is disabled", async () => {
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

    expect(result.dispatches).toHaveLength(1);
    expect(result.dispatches[0]).toMatchObject({
      channel: "email",
      deferred: false,
      notificationId: expect.any(String),
    });

    const notifications = await module.notificationService.listNotifications({
      storeId: TEST_STORE_A_ID,
      page: 1,
      limit: 10,
    });
    expect(notifications.total).toBe(1);
  });

  it("creates deferred jobs when defer is enabled", async () => {
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

    expect(result.dispatches[0]).toMatchObject({
      channel: "email",
      deferred: true,
      jobId: expect.any(String),
    });

    const jobs = await module.jobService.listJobs({
      storeId: TEST_STORE_A_ID,
      page: 1,
      limit: 10,
    });
    expect(jobs.total).toBe(1);
    expect(jobs.items[0]).toMatchObject({
      type: "notification.dispatch",
      status: "pending",
      payload: expect.objectContaining({
        sourceEventType: "shipment.shipped",
        notificationInput: expect.objectContaining({
          channel: "email",
        }),
      }),
    });

    const notifications = await module.notificationService.listNotifications({
      storeId: TEST_STORE_A_ID,
      page: 1,
      limit: 10,
    });
    expect(notifications.total).toBe(0);
  });

  it("dispatches multiple channels in one request", async () => {
    const module = createDomainNotificationTestModule({
      config: {
        "payment.failed": { email: true, sms: true, defer: false },
      },
    });

    const result = await module.domainNotificationService.dispatch({
      storeId: TEST_STORE_A_ID,
      sourceEventType: "payment.failed",
      sourceAggregateId: "payment-id",
      notifications: [
        validNotificationInput({
          subject: "Payment failed",
          body: "Payment failed email.",
        }),
        validNotificationInput({
          channel: "sms",
          to: undefined,
          subject: undefined,
          smsTo: { phone: "+15551234567" },
          body: "Payment failed sms.",
        }),
      ],
    });

    expect(result.dispatches).toHaveLength(2);
    expect(result.dispatches.map((item) => item.channel)).toEqual([
      "email",
      "sms",
    ]);
  });

  it("scopes created notifications to the requesting store", async () => {
    const notificationModule = createMemoryNotificationModule();
    const service = new DomainNotificationService({
      notificationService: notificationModule.notificationService,
      config: getDomainNotificationConfig({
        "order.confirmed": { email: true, defer: false },
      }),
    });

    const result = await service.dispatch({
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

    const notificationId = result.dispatches[0]?.notificationId;
    expect(notificationId).toBeDefined();

    await expect(
      notificationModule.notificationService.getNotification(
        TEST_STORE_B_ID,
        notificationId!,
      ),
    ).rejects.toMatchObject({
      code: NOTIFICATION_ERROR_CODES.NOT_FOUND,
      status: 404,
    });
  });

  it("skips disabled channels based on notification preferences", async () => {
    const module = createDomainNotificationTestModule({
      config: { "order.confirmed": { email: true, defer: false } },
    });
    const preferenceModule = createMemoryNotificationPreferenceModule();
    await preferenceModule.notificationPreferenceService.updatePreference(
      TEST_STORE_A_ID,
      TEST_USER_A_ID,
      "order_updates",
      validUpdateNotificationPreferenceInput({
        emailEnabled: false,
        smsEnabled: true,
        inAppEnabled: true,
      }),
    );

    const service = new DomainNotificationService({
      notificationService: module.notificationService,
      jobService: module.jobService,
      preferenceService: preferenceModule.notificationPreferenceService,
      config: getDomainNotificationConfig({
        "order.confirmed": { email: true, defer: false },
      }),
    });

    const result = await service.dispatch({
      storeId: TEST_STORE_A_ID,
      sourceEventType: "order.confirmed",
      sourceAggregateId: TEST_ORDER_ID,
      notifications: [
        validNotificationInput({
          userId: TEST_USER_A_ID,
          subject: "Order confirmed",
          body: "Your order is confirmed.",
        }),
      ],
    });

    expect(result.dispatches).toHaveLength(0);

    const notifications = await module.notificationService.listNotifications({
      storeId: TEST_STORE_A_ID,
      page: 1,
      limit: 10,
    });
    expect(notifications.total).toBe(0);
  });
});
