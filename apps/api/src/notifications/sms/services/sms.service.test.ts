import { describe, expect, it, vi } from "vitest";

import { createTestDomainEventPublisher } from "@/domain-events/testing/domain-events-test-utils";
import { DefaultSmsProviderFactory, MemorySmsProvider } from "../providers";
import { SMS_SIMULATE_FAILURE_KEY } from "../providers/console-sms.provider";
import { SmsService } from "./sms.service";

const sampleMessage = {
  storeId: "22222222-2222-2222-2222-222222222222",
  notificationId: "11111111-1111-1111-1111-111111111111",
  to: { phone: "+15551234567" },
  body: "Plain text body",
};

describe("SmsService", () => {
  it("sends plain-text SMS via the memory provider", async () => {
    const memorySmsProvider = new MemorySmsProvider();
    const smsService = new SmsService({
      smsProviderFactory: new DefaultSmsProviderFactory(
        new Map([["memory", memorySmsProvider]]),
      ),
    });

    const result = await smsService.sendSms(sampleMessage, "memory");

    expect(result.success).toBe(true);
    expect(memorySmsProvider.getDeliveries()).toHaveLength(1);
    expect(memorySmsProvider.getDeliveries()[0]?.message.body).toBe(
      "Plain text body",
    );
  });

  it("returns failure when provider simulates failure", async () => {
    const memorySmsProvider = new MemorySmsProvider();
    const smsService = new SmsService({
      smsProviderFactory: new DefaultSmsProviderFactory(
        new Map([["memory", memorySmsProvider]]),
      ),
    });

    const result = await smsService.sendSms(
      {
        ...sampleMessage,
        metadata: { [SMS_SIMULATE_FAILURE_KEY]: true },
      },
      "memory",
    );

    expect(result.success).toBe(false);
  });
});

describe("SmsService domain events", () => {
  it("emits sms.sent on success", async () => {
    const { dispatcher, publisher } = createTestDomainEventPublisher();
    const handler = vi.fn();
    dispatcher.subscribe("sms.sent", handler);

    const memorySmsProvider = new MemorySmsProvider();
    const smsService = new SmsService({
      smsProviderFactory: new DefaultSmsProviderFactory(
        new Map([["memory", memorySmsProvider]]),
      ),
      domainEventPublisher: publisher,
    });

    await smsService.sendSms(sampleMessage, "memory");

    await vi.waitFor(() => {
      expect(handler).toHaveBeenCalledOnce();
    });

    expect(handler.mock.calls[0]?.[0]).toMatchObject({
      eventType: "sms.sent",
      aggregateType: "sms_notification",
      aggregateId: sampleMessage.notificationId,
    });
  });

  it("emits sms.failed on provider failure", async () => {
    const { dispatcher, publisher } = createTestDomainEventPublisher();
    const handler = vi.fn();
    dispatcher.subscribe("sms.failed", handler);

    const memorySmsProvider = new MemorySmsProvider();
    const smsService = new SmsService({
      smsProviderFactory: new DefaultSmsProviderFactory(
        new Map([["memory", memorySmsProvider]]),
      ),
      domainEventPublisher: publisher,
    });

    await smsService.sendSms(
      {
        ...sampleMessage,
        metadata: { [SMS_SIMULATE_FAILURE_KEY]: true },
      },
      "memory",
    );

    await vi.waitFor(() => {
      expect(handler).toHaveBeenCalledOnce();
    });

    expect(handler.mock.calls[0]?.[0]).toMatchObject({
      eventType: "sms.failed",
    });
  });
});
