import { describe, expect, it } from "vitest";

import { SMS_ERROR_CODES } from "../errors";
import {
  ConsoleSmsProvider,
  DefaultSmsProviderFactory,
  MemorySmsProvider,
} from "../providers";
import { SMS_SIMULATE_FAILURE_KEY } from "../providers/console-sms.provider";

describe("SMS providers", () => {
  const sampleMessage = {
    storeId: "22222222-2222-2222-2222-222222222222",
    notificationId: "11111111-1111-1111-1111-111111111111",
    to: { phone: "+15551234567", name: "Jane Doe" },
    body: "Plain text body",
  };

  it("resolves console and memory providers from the factory", () => {
    const factory = new DefaultSmsProviderFactory(
      new Map([
        ["console", new ConsoleSmsProvider()],
        ["memory", new MemorySmsProvider()],
      ]),
    );

    expect(factory.resolve("console").provider).toBe("console");
    expect(factory.resolve("memory").provider).toBe("memory");
  });

  it("throws for unsupported providers", () => {
    const factory = new DefaultSmsProviderFactory(new Map());

    expect(() => factory.resolve("console")).toThrowError(
      expect.objectContaining({
        code: SMS_ERROR_CODES.UNSUPPORTED_PROVIDER,
      }),
    );
  });

  it("returns success from the memory provider by default", async () => {
    const provider = new MemorySmsProvider();
    const result = await provider.sendSms(sampleMessage);

    expect(result.success).toBe(true);
    expect(provider.getDeliveries()).toHaveLength(1);
  });

  it("simulates failure when metadata flag is set", async () => {
    const provider = new MemorySmsProvider();
    const result = await provider.sendSms({
      ...sampleMessage,
      metadata: { [SMS_SIMULATE_FAILURE_KEY]: true },
    });

    expect(result.success).toBe(false);
  });
});
