import type { Notification } from "@commerceflow/types";
import type {
  CreateNotificationInput,
  ListNotificationsQuery,
} from "@commerceflow/validation";

import {
  getDomainEventPublisher,
  type DomainEventPublisher,
} from "@/domain-events";
import { NOTIFICATION_ERROR_CODES, NotificationError } from "../errors";
import {
  getNotificationProviderFactory,
  type NotificationProviderFactory,
} from "../providers";
import {
  getNotificationRepository,
  type NotificationRepository,
} from "../repositories";

export interface NotificationServiceDependencies {
  readonly notificationRepository?: NotificationRepository;
  readonly notificationProviderFactory?: NotificationProviderFactory;
  readonly domainEventPublisher?: DomainEventPublisher;
}

export class NotificationService {
  private readonly notificationRepository: NotificationRepository;
  private readonly notificationProviderFactory: NotificationProviderFactory;
  private readonly domainEventPublisher: DomainEventPublisher;

  constructor(dependencies: NotificationServiceDependencies = {}) {
    this.notificationRepository =
      dependencies.notificationRepository ?? getNotificationRepository();
    this.notificationProviderFactory =
      dependencies.notificationProviderFactory ??
      getNotificationProviderFactory();
    this.domainEventPublisher =
      dependencies.domainEventPublisher ?? getDomainEventPublisher();
  }

  async createNotification(input: CreateNotificationInput): Promise<Notification> {
    let notification: Notification;

    try {
      notification = await this.notificationRepository.create(input);
    } catch (error) {
      throw this.mapRepositoryError(error);
    }

    this.domainEventPublisher.publishNotificationCreated(notification);

    const provider = this.notificationProviderFactory.resolve(input.provider);
    const sendResult = await provider.send({
      notificationId: notification.id,
      storeId: notification.storeId,
      channel: notification.channel,
      subject: notification.subject,
      title: notification.title,
      body: notification.body,
      userId: notification.userId,
      customerId: notification.customerId,
      metadata: notification.metadata,
    });

    if (sendResult.success) {
      try {
        const sentAt = new Date().toISOString();
        notification = await this.notificationRepository.markSent(
          notification.storeId,
          notification.id,
          sentAt,
        );
      } catch (error) {
        throw this.mapRepositoryError(error);
      }

      this.domainEventPublisher.publishNotificationSent(notification);
      return notification;
    }

    try {
      notification = await this.notificationRepository.markFailed(
        notification.storeId,
        notification.id,
      );
    } catch (error) {
      throw this.mapRepositoryError(error);
    }

    this.domainEventPublisher.publishNotificationFailed(
      notification,
      sendResult.message,
    );

    return notification;
  }

  async getNotification(storeId: string, id: string): Promise<Notification> {
    const notification = await this.notificationRepository.findById(storeId, id);

    if (!notification) {
      throw new NotificationError(
        NOTIFICATION_ERROR_CODES.NOT_FOUND,
        "Notification not found",
        404,
      );
    }

    return notification;
  }

  async listNotifications(query: ListNotificationsQuery) {
    return this.notificationRepository.list(query);
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

export const notificationService = new NotificationService();
