import type { InAppNotification } from "@commerceflow/types";
import type {
  InAppNotificationQuery,
  ListInAppNotificationsQuery,
} from "@commerceflow/validation";

import {
  getDomainEventPublisher,
  type DomainEventPublisher,
} from "@/domain-events";
import { NOTIFICATION_ERROR_CODES, NotificationError } from "../../errors";
import {
  getNotificationRepository,
  type NotificationRepository,
} from "../../repositories";
import {
  isInAppNotificationForUser,
  toInAppNotification,
} from "./in-app-notification.utils";

export interface InAppNotificationServiceDependencies {
  readonly notificationRepository?: NotificationRepository;
  readonly domainEventPublisher?: DomainEventPublisher;
}

export class InAppNotificationService {
  private readonly notificationRepository: NotificationRepository;
  private readonly domainEventPublisher: DomainEventPublisher;

  constructor(dependencies: InAppNotificationServiceDependencies = {}) {
    this.notificationRepository =
      dependencies.notificationRepository ?? getNotificationRepository();
    this.domainEventPublisher =
      dependencies.domainEventPublisher ?? getDomainEventPublisher();
  }

  async listInAppNotifications(query: ListInAppNotificationsQuery) {
    const result = await this.notificationRepository.listInApp(query);

    return {
      ...result,
      items: result.items.map(toInAppNotification),
    };
  }

  async getInAppNotification(
    id: string,
    query: InAppNotificationQuery,
  ): Promise<InAppNotification> {
    const notification = await this.getOwnedInAppNotification(id, query);
    return toInAppNotification(notification);
  }

  async markAsRead(
    id: string,
    query: InAppNotificationQuery,
  ): Promise<InAppNotification> {
    const existing = await this.getOwnedInAppNotification(id, query);

    if (existing.readAt) {
      return toInAppNotification(existing);
    }

    const readAt = new Date().toISOString();
    let notification: typeof existing;

    try {
      notification = await this.notificationRepository.markRead(
        query.storeId,
        id,
        readAt,
      );
    } catch (error) {
      throw this.mapRepositoryError(error);
    }

    this.domainEventPublisher.publishInAppNotificationRead(notification);
    return toInAppNotification(notification);
  }

  async markAsUnread(
    id: string,
    query: InAppNotificationQuery,
  ): Promise<InAppNotification> {
    const existing = await this.getOwnedInAppNotification(id, query);

    if (!existing.readAt) {
      return toInAppNotification(existing);
    }

    let notification: typeof existing;

    try {
      notification = await this.notificationRepository.markUnread(
        query.storeId,
        id,
      );
    } catch (error) {
      throw this.mapRepositoryError(error);
    }

    this.domainEventPublisher.publishInAppNotificationUnread(notification);
    return toInAppNotification(notification);
  }

  private async getOwnedInAppNotification(
    id: string,
    query: InAppNotificationQuery,
  ) {
    const notification = await this.notificationRepository.findById(
      query.storeId,
      id,
    );

    if (
      !notification ||
      !isInAppNotificationForUser(notification, query.userId)
    ) {
      throw new NotificationError(
        NOTIFICATION_ERROR_CODES.NOT_FOUND,
        "In-app notification not found",
        404,
      );
    }

    return notification;
  }

  private mapRepositoryError(error: unknown): NotificationError {
    if (error instanceof NotificationError) {
      return error;
    }

    return new NotificationError(
      NOTIFICATION_ERROR_CODES.REPOSITORY_ERROR,
      error instanceof Error ? error.message : "Notification repository error",
      500,
    );
  }
}

export const inAppNotificationService = new InAppNotificationService();
