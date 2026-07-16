import { describe, expect, it } from "vitest";

import { NOTIFICATION_ERROR_CODES } from "../errors";
import {
  ConsoleNotificationProvider,
  DefaultNotificationProviderFactory,
  MemoryNotificationProvider,
} from "../providers";
import { NOTIFICATION_SIMULATE_FAILURE_KEY } from "../providers/console-notification.provider";

describe("Notification providers", () => {
  it("resolves console and memory providers from the factory", () => {
    const factory = new DefaultNotificationProviderFactory(
      new Map([
        ["console", new ConsoleNotificationProvider()],
        ["memory", new MemoryNotificationProvider()],
      ]),
    );

    expect(factory.resolve("console").provider).toBe("console");
    expect(factory.resolve("memory").provider).toBe("memory");
  });

  it("throws for unsupported providers", () => {
    const factory = new DefaultNotificationProviderFactory(new Map());

    expect(() => factory.resolve("console")).toThrowError(
      expect.objectContaining({
        code: NOTIFICATION_ERROR_CODES.UNSUPPORTED_PROVIDER,
      }),
    );
  });

  it("returns success from console provider by default", async () => {
    const provider = new ConsoleNotificationProvider();
    const result = await provider.send({
      notificationId: "11111111-1111-1111-1111-111111111111",
      storeId: "22222222-2222-2222-2222-222222222222",
      channel: "email",
      body: "Hello",
    });

    expect(result.success).toBe(true);
    expect(result.providerReference).toBeDefined();
  });

  it("simulates failure when metadata flag is set", async () => {
    const provider = new MemoryNotificationProvider();
    const result = await provider.send({
      notificationId: "11111111-1111-1111-1111-111111111111",
      storeId: "22222222-2222-2222-2222-222222222222",
      channel: "in_app",
      body: "Hello",
      metadata: { [NOTIFICATION_SIMULATE_FAILURE_KEY]: true },
    });

    expect(result.success).toBe(false);
    expect(provider.getDeliveries()).toHaveLength(1);
  });
});
