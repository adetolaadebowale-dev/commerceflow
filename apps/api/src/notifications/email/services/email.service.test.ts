import { describe, expect, it, vi } from "vitest";

import { createTestDomainEventPublisher } from "@/domain-events/testing/domain-events-test-utils";
import { DefaultEmailProviderFactory, MemoryEmailProvider } from "../providers";
import { EMAIL_SIMULATE_FAILURE_KEY } from "../providers/console-email.provider";
import { EmailService } from "./email.service";

const sampleMessage = {
  storeId: "22222222-2222-2222-2222-222222222222",
  notificationId: "11111111-1111-1111-1111-111111111111",
  to: { email: "user@example.com" },
  subject: "Hello",
  body: "Plain text body",
};

describe("EmailService", () => {
  it("sends plain-text email via the memory provider", async () => {
    const memoryEmailProvider = new MemoryEmailProvider();
    const emailService = new EmailService({
      emailProviderFactory: new DefaultEmailProviderFactory(
        new Map([["memory", memoryEmailProvider]]),
      ),
    });

    const result = await emailService.sendEmail(sampleMessage, "memory");

    expect(result.success).toBe(true);
    expect(memoryEmailProvider.getDeliveries()).toHaveLength(1);
    expect(memoryEmailProvider.getDeliveries()[0]?.message.body).toBe(
      "Plain text body",
    );
  });

  it("returns failure when provider simulates failure", async () => {
    const memoryEmailProvider = new MemoryEmailProvider();
    const emailService = new EmailService({
      emailProviderFactory: new DefaultEmailProviderFactory(
        new Map([["memory", memoryEmailProvider]]),
      ),
    });

    const result = await emailService.sendEmail(
      {
        ...sampleMessage,
        metadata: { [EMAIL_SIMULATE_FAILURE_KEY]: true },
      },
      "memory",
    );

    expect(result.success).toBe(false);
  });
});

describe("EmailService domain events", () => {
  it("emits email.sent on success", async () => {
    const { dispatcher, publisher } = createTestDomainEventPublisher();
    const handler = vi.fn();
    dispatcher.subscribe("email.sent", handler);

    const memoryEmailProvider = new MemoryEmailProvider();
    const emailService = new EmailService({
      emailProviderFactory: new DefaultEmailProviderFactory(
        new Map([["memory", memoryEmailProvider]]),
      ),
      domainEventPublisher: publisher,
    });

    await emailService.sendEmail(sampleMessage, "memory");

    await vi.waitFor(() => {
      expect(handler).toHaveBeenCalledOnce();
    });

    expect(handler.mock.calls[0]?.[0]).toMatchObject({
      eventType: "email.sent",
      aggregateType: "email_notification",
      aggregateId: sampleMessage.notificationId,
    });
  });

  it("emits email.failed on provider failure", async () => {
    const { dispatcher, publisher } = createTestDomainEventPublisher();
    const handler = vi.fn();
    dispatcher.subscribe("email.failed", handler);

    const memoryEmailProvider = new MemoryEmailProvider();
    const emailService = new EmailService({
      emailProviderFactory: new DefaultEmailProviderFactory(
        new Map([["memory", memoryEmailProvider]]),
      ),
      domainEventPublisher: publisher,
    });

    await emailService.sendEmail(
      {
        ...sampleMessage,
        metadata: { [EMAIL_SIMULATE_FAILURE_KEY]: true },
      },
      "memory",
    );

    await vi.waitFor(() => {
      expect(handler).toHaveBeenCalledOnce();
    });

    expect(handler.mock.calls[0]?.[0]).toMatchObject({
      eventType: "email.failed",
    });
  });
});
