import { describe, expect, it } from "vitest";

import {
  inAppNotificationQuerySchema,
  listInAppNotificationsQuerySchema,
} from "./in-app.schemas";

describe("in-app notification schemas", () => {
  it("validates list in-app notifications query", () => {
    const parsed = listInAppNotificationsQuerySchema.parse({
      storeId: "11111111-1111-1111-1111-111111111111",
      userId: "22222222-2222-2222-2222-222222222222",
      page: "2",
      limit: "10",
      unreadOnly: "true",
    });

    expect(parsed.page).toBe(2);
    expect(parsed.limit).toBe(10);
    expect(parsed.unreadOnly).toBe(true);
  });

  it("defaults pagination values for list queries", () => {
    const parsed = listInAppNotificationsQuerySchema.parse({
      storeId: "11111111-1111-1111-1111-111111111111",
      userId: "22222222-2222-2222-2222-222222222222",
    });

    expect(parsed.page).toBe(1);
    expect(parsed.limit).toBe(20);
    expect(parsed.unreadOnly).toBeUndefined();
  });

  it("validates in-app notification scoped query", () => {
    const parsed = inAppNotificationQuerySchema.parse({
      storeId: "11111111-1111-1111-1111-111111111111",
      userId: "22222222-2222-2222-2222-222222222222",
    });

    expect(parsed.storeId).toBe("11111111-1111-1111-1111-111111111111");
    expect(parsed.userId).toBe("22222222-2222-2222-2222-222222222222");
  });
});
