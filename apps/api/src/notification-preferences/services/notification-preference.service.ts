import type { NotificationChannel } from "@commerceflow/types";
import {
  DEFAULT_NOTIFICATION_PREFERENCE_CHANNELS,
  DOMAIN_EVENT_TO_NOTIFICATION_PREFERENCE_TYPE,
  NOTIFICATION_PREFERENCE_TYPES,
  type DomainNotificationEventType,
  type NotificationPreference,
  type NotificationPreferenceType,
  type NotificationPreferenceView,
} from "@commerceflow/types";
import type { CreateNotificationInput } from "@commerceflow/validation";
import type { UpdateNotificationPreferenceInput } from "@commerceflow/validation";

import {
  getDomainEventPublisher,
  type DomainEventPublisher,
} from "@/domain-events";
import {
  NOTIFICATION_PREFERENCE_ERROR_CODES,
  NotificationPreferenceError,
} from "../errors";
import {
  getNotificationPreferenceRepository,
  type NotificationPreferenceRepository,
} from "../repositories";

export interface NotificationPreferenceServiceDependencies {
  readonly notificationPreferenceRepository?: NotificationPreferenceRepository;
  readonly domainEventPublisher?: DomainEventPublisher;
}

function toPreferenceView(
  notificationType: NotificationPreferenceType,
  preference?: NotificationPreference | null,
): NotificationPreferenceView {
  return {
    notificationType,
    emailEnabled:
      preference?.emailEnabled ??
      DEFAULT_NOTIFICATION_PREFERENCE_CHANNELS.emailEnabled,
    smsEnabled:
      preference?.smsEnabled ?? DEFAULT_NOTIFICATION_PREFERENCE_CHANNELS.smsEnabled,
    inAppEnabled:
      preference?.inAppEnabled ??
      DEFAULT_NOTIFICATION_PREFERENCE_CHANNELS.inAppEnabled,
    id: preference?.id,
    updatedAt: preference?.updatedAt,
  };
}

export class NotificationPreferenceService {
  private readonly notificationPreferenceRepository: NotificationPreferenceRepository;
  private readonly domainEventPublisher: DomainEventPublisher;

  constructor(dependencies: NotificationPreferenceServiceDependencies = {}) {
    this.notificationPreferenceRepository =
      dependencies.notificationPreferenceRepository ??
      getNotificationPreferenceRepository();
    this.domainEventPublisher =
      dependencies.domainEventPublisher ?? getDomainEventPublisher();
  }

  async listPreferences(
    storeId: string,
    userId: string,
  ): Promise<readonly NotificationPreferenceView[]> {
    let persisted: readonly NotificationPreference[];

    try {
      persisted = await this.notificationPreferenceRepository.listByStoreAndUser(
        storeId,
        userId,
      );
    } catch (error) {
      throw this.mapRepositoryError(error);
    }

    const persistedByType = new Map(
      persisted.map((preference) => [preference.notificationType, preference]),
    );

    return NOTIFICATION_PREFERENCE_TYPES.map((notificationType) =>
      toPreferenceView(notificationType, persistedByType.get(notificationType)),
    );
  }

  async getEffectivePreference(
    storeId: string,
    userId: string,
    notificationType: NotificationPreferenceType,
  ): Promise<NotificationPreferenceView> {
    let preference: NotificationPreference | null;

    try {
      preference =
        await this.notificationPreferenceRepository.findByStoreUserAndType(
          storeId,
          userId,
          notificationType,
        );
    } catch (error) {
      throw this.mapRepositoryError(error);
    }

    return toPreferenceView(notificationType, preference);
  }

  async isChannelEnabled(
    storeId: string,
    userId: string,
    notificationType: NotificationPreferenceType,
    channel: NotificationChannel,
  ): Promise<boolean> {
    const preference = await this.getEffectivePreference(
      storeId,
      userId,
      notificationType,
    );

    if (channel === "email") {
      return preference.emailEnabled;
    }

    if (channel === "sms") {
      return preference.smsEnabled;
    }

    return preference.inAppEnabled;
  }

  async updatePreference(
    storeId: string,
    userId: string,
    notificationType: NotificationPreferenceType,
    input: UpdateNotificationPreferenceInput,
  ): Promise<NotificationPreference> {
    let preference: NotificationPreference;

    try {
      preference = await this.notificationPreferenceRepository.upsert(
        storeId,
        userId,
        notificationType,
        {
          emailEnabled: input.emailEnabled,
          smsEnabled: input.smsEnabled,
          inAppEnabled: input.inAppEnabled,
        },
      );
    } catch (error) {
      throw this.mapRepositoryError(error);
    }

    this.domainEventPublisher.publishNotificationPreferenceUpdated(preference);
    return preference;
  }

  async filterNotificationsForDispatch(
    storeId: string,
    sourceEventType: DomainNotificationEventType,
    notifications: readonly CreateNotificationInput[],
  ): Promise<CreateNotificationInput[]> {
    const notificationType =
      DOMAIN_EVENT_TO_NOTIFICATION_PREFERENCE_TYPE[sourceEventType];
    const filtered: CreateNotificationInput[] = [];

    for (const notification of notifications) {
      if (!notification.userId) {
        filtered.push(notification);
        continue;
      }

      const enabled = await this.isChannelEnabled(
        storeId,
        notification.userId,
        notificationType,
        notification.channel,
      );

      if (enabled) {
        filtered.push(notification);
      }
    }

    return filtered;
  }

  private mapRepositoryError(error: unknown): NotificationPreferenceError {
    if (error instanceof NotificationPreferenceError) {
      return error;
    }

    return new NotificationPreferenceError(
      NOTIFICATION_PREFERENCE_ERROR_CODES.REPOSITORY_ERROR,
      "Notification preference repository operation failed",
      500,
      error instanceof Error ? error.message : error,
    );
  }
}

export const notificationPreferenceService = new NotificationPreferenceService();
