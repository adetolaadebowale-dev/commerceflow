import { describe, expect, it } from "vitest";

import {
  createNotificationSchema,
  listNotificationsQuerySchema,
} from "./notification.schemas";

describe("notification schemas", () => {
  const validUuid = "11111111-1111-1111-1111-111111111111";

  it("accepts a valid create notification payload", () => {
    const parsed = createNotificationSchema.safeParse({
      storeId: validUuid,
      channel: "email",
      to: { email: "user@example.com" },
      body: "Your order has shipped.",
      subject: "Order update",
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.provider).toBe("console");
    }
  });

  it("requires recipient for email channel notifications", () => {
    const parsed = createNotificationSchema.safeParse({
      storeId: validUuid,
      channel: "email",
      body: "Your order has shipped.",
      subject: "Order update",
    });

    expect(parsed.success).toBe(false);
  });

  it("rejects create payloads without body", () => {
    const parsed = createNotificationSchema.safeParse({
      storeId: validUuid,
      channel: "in_app",
    });

    expect(parsed.success).toBe(false);
  });

  it("accepts list query filters", () => {
    const parsed = listNotificationsQuerySchema.safeParse({
      storeId: validUuid,
      status: "sent",
      channel: "sms",
    });

    expect(parsed.success).toBe(true);
  });
});
