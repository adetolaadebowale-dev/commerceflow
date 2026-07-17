import type {
  NotificationPreference,
  NotificationPreferenceType,
} from "@commerceflow/types";

import type { NotificationPreferenceRepository } from "./notification-preference.repository";

function preferenceKey(
  storeId: string,
  userId: string,
  notificationType: NotificationPreferenceType,
): string {
  return `${storeId}:${userId}:${notificationType}`;
}

export class MemoryNotificationPreferenceRepository
  implements NotificationPreferenceRepository
{
  private readonly preferencesByKey = new Map<string, NotificationPreference>();
  private transactionFailure: Error | null = null;

  setTransactionFailure(error: Error | null): void {
    this.transactionFailure = error;
  }

  getAll(): readonly NotificationPreference[] {
    return [...this.preferencesByKey.values()];
  }

  async findByStoreUserAndType(
    storeId: string,
    userId: string,
    notificationType: NotificationPreferenceType,
  ): Promise<NotificationPreference | null> {
    return (
      this.preferencesByKey.get(
        preferenceKey(storeId, userId, notificationType),
      ) ?? null
    );
  }

  async listByStoreAndUser(
    storeId: string,
    userId: string,
  ): Promise<readonly NotificationPreference[]> {
    return [...this.preferencesByKey.values()]
      .filter(
        (preference) =>
          preference.storeId === storeId && preference.userId === userId,
      )
      .sort((left, right) =>
        left.notificationType.localeCompare(right.notificationType),
      );
  }

  async upsert(
    storeId: string,
    userId: string,
    notificationType: NotificationPreferenceType,
    input: {
      emailEnabled: boolean;
      smsEnabled: boolean;
      inAppEnabled: boolean;
    },
  ): Promise<NotificationPreference> {
    if (this.transactionFailure) {
      throw this.transactionFailure;
    }

    const key = preferenceKey(storeId, userId, notificationType);
    const existing = this.preferencesByKey.get(key);
    const now = new Date().toISOString();
    const preference: NotificationPreference = {
      id: existing?.id ?? crypto.randomUUID(),
      storeId,
      userId,
      notificationType,
      emailEnabled: input.emailEnabled,
      smsEnabled: input.smsEnabled,
      inAppEnabled: input.inAppEnabled,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };

    this.preferencesByKey.set(key, preference);
    return preference;
  }
}
