import { describe, expect, it } from "vitest";

import { sendTestSmsNotificationSchema } from "./sms.schemas";

describe("sms notification schemas", () => {
  const validUuid = "11111111-1111-1111-1111-111111111111";

  it("accepts a valid test SMS payload", () => {
    const parsed = sendTestSmsNotificationSchema.safeParse({
      storeId: validUuid,
      to: { phone: "+15551234567", name: "Jane Doe" },
      body: "Your order has shipped.",
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.provider).toBe("console");
    }
  });

  it("rejects payloads without a phone number", () => {
    const parsed = sendTestSmsNotificationSchema.safeParse({
      storeId: validUuid,
      to: { phone: "" },
      body: "Hello",
    });

    expect(parsed.success).toBe(false);
  });

  it("rejects invalid phone numbers", () => {
    const parsed = sendTestSmsNotificationSchema.safeParse({
      storeId: validUuid,
      to: { phone: "not-a-phone" },
      body: "Hello",
    });

    expect(parsed.success).toBe(false);
  });
});
