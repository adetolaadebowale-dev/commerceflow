import type { CreateNotificationInput } from "@commerceflow/validation";

import type { DomainEventPublisher } from "@/domain-events";
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
} = {}) {
  const notificationRepository = new MemoryNotificationRepository();
  const memoryProvider = options.memoryProvider ?? new MemoryNotificationProvider();

  return {
    notificationRepository,
    memoryProvider,
    notificationService: new NotificationService({
      notificationRepository,
      notificationProviderFactory: new DefaultNotificationProviderFactory(
        new Map([["memory", memoryProvider]]),
      ),
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
    body: "Your order has shipped.",
    subject: "Order update",
    ...overrides,
  };
}
