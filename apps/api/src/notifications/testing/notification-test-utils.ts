import type {
  CreateNotificationInput,
  SendTestEmailNotificationInput,
} from "@commerceflow/validation";

import type { DomainEventPublisher } from "@/domain-events";
import { DefaultEmailProviderFactory, MemoryEmailProvider } from "../email/providers";
import { EmailService } from "../email/services/email.service";
import {
  DefaultNotificationProviderFactory,
  MemoryNotificationProvider,
} from "../providers";
import { MemoryNotificationRepository } from "../repositories/memory-notification.repository";
import { NotificationService } from "../services/notification.service";

export const TEST_STORE_A_ID = "11111111-1111-1111-1111-111111111111";
export const TEST_STORE_B_ID = "22222222-2222-2222-2222-222222222222";

export function createMemoryNotificationModule(options: {
  domainEventPublisher?: DomainEventPublisher;
  memoryProvider?: MemoryNotificationProvider;
  memoryEmailProvider?: MemoryEmailProvider;
} = {}) {
  const notificationRepository = new MemoryNotificationRepository();
  const memoryProvider = options.memoryProvider ?? new MemoryNotificationProvider();
  const memoryEmailProvider =
    options.memoryEmailProvider ?? new MemoryEmailProvider();

  const emailService = new EmailService({
    emailProviderFactory: new DefaultEmailProviderFactory(
      new Map([["memory", memoryEmailProvider]]),
    ),
    domainEventPublisher: options.domainEventPublisher,
  });

  return {
    notificationRepository,
    memoryProvider,
    memoryEmailProvider,
    emailService,
    notificationService: new NotificationService({
      notificationRepository,
      notificationProviderFactory: new DefaultNotificationProviderFactory(
        new Map([["memory", memoryProvider]]),
      ),
      emailService,
      domainEventPublisher: options.domainEventPublisher,
    }),
  };
}

export function validNotificationInput(
  overrides: Partial<CreateNotificationInput> = {},
): CreateNotificationInput {
  return {
    storeId: TEST_STORE_A_ID,
    channel: "email",
    provider: "memory",
    to: { email: "customer@example.com", name: "Jane Doe" },
    body: "Your order has shipped.",
    subject: "Order update",
    ...overrides,
  };
}

export function validTestEmailInput(
  overrides: Partial<SendTestEmailNotificationInput> = {},
): SendTestEmailNotificationInput {
  return {
    storeId: TEST_STORE_A_ID,
    to: { email: "customer@example.com", name: "Jane Doe" },
    subject: "Test email",
    body: "Hello from CommerceFlow.",
    provider: "memory",
    ...overrides,
  };
}
