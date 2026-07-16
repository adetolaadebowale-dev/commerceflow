import { describe, expect, it } from "vitest";

import { EMAIL_ERROR_CODES } from "../errors";
import {
  ConsoleEmailProvider,
  DefaultEmailProviderFactory,
  MemoryEmailProvider,
} from "../providers";
import { EMAIL_SIMULATE_FAILURE_KEY } from "../providers/console-email.provider";

describe("Email providers", () => {
  const sampleMessage = {
    storeId: "22222222-2222-2222-2222-222222222222",
    notificationId: "11111111-1111-1111-1111-111111111111",
    to: { email: "user@example.com", name: "Jane Doe" },
    subject: "Hello",
    body: "Plain text body",
  };

  it("resolves console and memory providers from the factory", () => {
    const factory = new DefaultEmailProviderFactory(
      new Map([
        ["console", new ConsoleEmailProvider()],
        ["memory", new MemoryEmailProvider()],
      ]),
    );

    expect(factory.resolve("console").provider).toBe("console");
    expect(factory.resolve("memory").provider).toBe("memory");
  });

  it("throws for unsupported providers", () => {
    const factory = new DefaultEmailProviderFactory(new Map());

    expect(() => factory.resolve("console")).toThrowError(
      expect.objectContaining({
        code: EMAIL_ERROR_CODES.UNSUPPORTED_PROVIDER,
      }),
    );
  });

  it("returns success from the memory provider by default", async () => {
    const provider = new MemoryEmailProvider();
    const result = await provider.sendEmail(sampleMessage);

    expect(result.success).toBe(true);
    expect(provider.getDeliveries()).toHaveLength(1);
  });

  it("simulates failure when metadata flag is set", async () => {
    const provider = new MemoryEmailProvider();
    const result = await provider.sendEmail({
      ...sampleMessage,
      metadata: { [EMAIL_SIMULATE_FAILURE_KEY]: true },
    });

    expect(result.success).toBe(false);
  });
});
