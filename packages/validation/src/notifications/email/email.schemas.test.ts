import { describe, expect, it } from "vitest";

import { sendTestEmailNotificationSchema } from "./email.schemas";

describe("email notification schemas", () => {
  const validUuid = "11111111-1111-1111-1111-111111111111";

  it("accepts a valid test email payload", () => {
    const parsed = sendTestEmailNotificationSchema.safeParse({
      storeId: validUuid,
      to: { email: "user@example.com", name: "Jane Doe" },
      subject: "Test email",
      body: "Hello from CommerceFlow.",
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.provider).toBe("console");
    }
  });

  it("rejects invalid recipient email addresses", () => {
    const parsed = sendTestEmailNotificationSchema.safeParse({
      storeId: validUuid,
      to: { email: "not-an-email" },
      subject: "Test",
      body: "Body",
    });

    expect(parsed.success).toBe(false);
  });

  it("rejects empty subject and body", () => {
    const parsed = sendTestEmailNotificationSchema.safeParse({
      storeId: validUuid,
      to: { email: "user@example.com" },
      subject: "",
      body: "",
    });

    expect(parsed.success).toBe(false);
  });
});
