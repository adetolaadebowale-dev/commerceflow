import type { UpdateNotificationPreferenceInput } from "@commerceflow/validation";

import type { DomainEventPublisher } from "@/domain-events";
import { MemoryNotificationPreferenceRepository } from "../repositories/memory-notification-preference.repository";
import { NotificationPreferenceService } from "../services/notification-preference.service";

export const TEST_STORE_A_ID = "11111111-1111-1111-1111-111111111111";
export const TEST_STORE_B_ID = "22222222-2222-2222-2222-222222222222";
export const TEST_USER_A_ID = "33333333-3333-3333-3333-333333333333";
export const TEST_USER_B_ID = "44444444-4444-4444-4444-444444444444";

export function createMemoryNotificationPreferenceModule(options: {
  domainEventPublisher?: DomainEventPublisher;
} = {}) {
  const notificationPreferenceRepository =
    new MemoryNotificationPreferenceRepository();

  return {
    notificationPreferenceRepository,
    notificationPreferenceService: new NotificationPreferenceService({
      notificationPreferenceRepository,
      domainEventPublisher: options.domainEventPublisher,
    }),
  };
}

export function validUpdateNotificationPreferenceInput(
  overrides: Partial<UpdateNotificationPreferenceInput> = {},
): UpdateNotificationPreferenceInput {
  return {
    storeId: TEST_STORE_A_ID,
    emailEnabled: true,
    smsEnabled: true,
    inAppEnabled: true,
    ...overrides,
  };
}
