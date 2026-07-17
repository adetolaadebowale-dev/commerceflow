import { describe, expect, it } from "vitest";

import {
  createMemoryNotificationPreferenceModule,
  TEST_STORE_A_ID,
  TEST_STORE_B_ID,
  TEST_USER_A_ID,
  validUpdateNotificationPreferenceInput,
} from "../testing/notification-preference-test-utils";

describe("NotificationPreferenceService", () => {
  it("returns all categories enabled by default", async () => {
    const module = createMemoryNotificationPreferenceModule();
    const preferences = await module.notificationPreferenceService.listPreferences(
      TEST_STORE_A_ID,
      TEST_USER_A_ID,
    );

    expect(preferences).toHaveLength(5);
    expect(preferences.every((preference) => preference.emailEnabled)).toBe(true);
    expect(preferences.every((preference) => preference.smsEnabled)).toBe(true);
    expect(preferences.every((preference) => preference.inAppEnabled)).toBe(true);
  });

  it("updates and persists preferences for a user and category", async () => {
    const module = createMemoryNotificationPreferenceModule();
    const preference = await module.notificationPreferenceService.updatePreference(
      TEST_STORE_A_ID,
      TEST_USER_A_ID,
      "payment_updates",
      validUpdateNotificationPreferenceInput({
        emailEnabled: false,
        smsEnabled: true,
        inAppEnabled: false,
      }),
    );

    expect(preference).toMatchObject({
      storeId: TEST_STORE_A_ID,
      userId: TEST_USER_A_ID,
      notificationType: "payment_updates",
      emailEnabled: false,
      smsEnabled: true,
      inAppEnabled: false,
    });

    const listed = await module.notificationPreferenceService.listPreferences(
      TEST_STORE_A_ID,
      TEST_USER_A_ID,
    );
    const paymentPreference = listed.find(
      (item) => item.notificationType === "payment_updates",
    );

    expect(paymentPreference).toMatchObject({
      emailEnabled: false,
      inAppEnabled: false,
      id: preference.id,
    });
  });

  it("filters disabled channels during domain notification dispatch", async () => {
    const module = createMemoryNotificationPreferenceModule();
    await module.notificationPreferenceService.updatePreference(
      TEST_STORE_A_ID,
      TEST_USER_A_ID,
      "order_updates",
      validUpdateNotificationPreferenceInput({
        emailEnabled: false,
        smsEnabled: true,
        inAppEnabled: false,
      }),
    );

    const filtered =
      await module.notificationPreferenceService.filterNotificationsForDispatch(
        TEST_STORE_A_ID,
        "order.confirmed",
        [
          {
            storeId: TEST_STORE_A_ID,
            userId: TEST_USER_A_ID,
            channel: "email",
            provider: "memory",
            to: { email: "user@example.com" },
            subject: "Order confirmed",
            body: "Your order is confirmed.",
          },
          {
            storeId: TEST_STORE_A_ID,
            userId: TEST_USER_A_ID,
            channel: "sms",
            provider: "memory",
            smsTo: { phone: "+15551234567" },
            body: "Your order is confirmed.",
          },
        ],
      );

    expect(filtered.map((item) => item.channel)).toEqual(["sms"]);
  });

  it("isolates preferences by store", async () => {
    const module = createMemoryNotificationPreferenceModule();
    await module.notificationPreferenceService.updatePreference(
      TEST_STORE_A_ID,
      TEST_USER_A_ID,
      "order_updates",
      validUpdateNotificationPreferenceInput({ emailEnabled: false }),
    );

    const storeBPreferences =
      await module.notificationPreferenceService.listPreferences(
        TEST_STORE_B_ID,
        TEST_USER_A_ID,
      );

    expect(
      storeBPreferences.find((item) => item.notificationType === "order_updates")
        ?.emailEnabled,
    ).toBe(true);
  });
});
