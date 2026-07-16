import type { Notification } from "@commerceflow/types";
import type {
  CreateNotificationInput,
  ListNotificationsQuery,
  SendTestEmailNotificationInput,
  SendTestSmsNotificationInput,
} from "@commerceflow/validation";

import {
  getDomainEventPublisher,
  type DomainEventPublisher,
} from "@/domain-events";
import { emailService, type EmailService } from "../email/services";
import { NOTIFICATION_ERROR_CODES, NotificationError } from "../errors";
import {
  getNotificationProviderFactory,
  type NotificationProviderFactory,
} from "../providers";
import {
  getNotificationRepository,
  type NotificationRepository,
} from "../repositories";
import { smsService, type SmsService } from "../sms/services";
import {
  buildEmailMessageFromNotification,
  mapEmailSendResultToNotificationResult,
  toEmailProviderType,
} from "./notification-email.utils";
import {
  buildSmsMessageFromNotification,
  mapSmsSendResultToNotificationResult,
  toSmsProviderType,
} from "./notification-sms.utils";

export interface NotificationServiceDependencies {
  readonly notificationRepository?: NotificationRepository;
  readonly notificationProviderFactory?: NotificationProviderFactory;
  readonly emailService?: EmailService;
  readonly smsService?: SmsService;
  readonly domainEventPublisher?: DomainEventPublisher;
}

export class NotificationService {
  private readonly notificationRepository: NotificationRepository;
  private readonly notificationProviderFactory: NotificationProviderFactory;
  private readonly emailService: EmailService;
  private readonly smsService: SmsService;
  private readonly domainEventPublisher: DomainEventPublisher;

  constructor(dependencies: NotificationServiceDependencies = {}) {
    this.notificationRepository =
      dependencies.notificationRepository ?? getNotificationRepository();
    this.notificationProviderFactory =
      dependencies.notificationProviderFactory ??
      getNotificationProviderFactory();
    this.emailService = dependencies.emailService ?? emailService;
    this.smsService = dependencies.smsService ?? smsService;
    this.domainEventPublisher =
      dependencies.domainEventPublisher ?? getDomainEventPublisher();
  }

  async sendTestEmailNotification(
    input: SendTestEmailNotificationInput,
  ): Promise<Notification> {
    return this.createNotification({
      storeId: input.storeId,
      channel: "email",
      provider: input.provider,
      to: input.to,
      subject: input.subject,
      body: input.body,
      metadata: input.metadata,
    });
  }

  async sendTestSmsNotification(
    input: SendTestSmsNotificationInput,
  ): Promise<Notification> {
    return this.createNotification({
      storeId: input.storeId,
      channel: "sms",
      provider: input.provider,
      smsTo: input.to,
      body: input.body,
      metadata: input.metadata,
    });
  }

  async createNotification(input: CreateNotificationInput): Promise<Notification> {
    let notification: Notification;

    try {
      notification = await this.notificationRepository.create(input);
    } catch (error) {
      throw this.mapRepositoryError(error);
    }

    this.domainEventPublisher.publishNotificationCreated(notification);

    const sendResult = await this.dispatchNotification(notification, input);

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

  private async dispatchNotification(
    notification: Notification,
    input: CreateNotificationInput,
  ) {
    if (notification.channel === "email") {
      return this.dispatchEmailNotification(notification, input);
    }

    if (notification.channel === "sms") {
      return this.dispatchSmsNotification(notification, input);
    }

    return this.dispatchGenericNotification(notification, input);
  }

  private async dispatchGenericNotification(
    notification: Notification,
    input: CreateNotificationInput,
  ) {
    const provider = this.notificationProviderFactory.resolve(input.provider);

    return provider.send({
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
  }

  private async dispatchEmailNotification(
    notification: Notification,
    input: CreateNotificationInput,
  ) {
    if (!input.to) {
      return {
        success: false,
        message: "Email recipient is required",
      };
    }

    const emailResult = await this.emailService.sendEmail(
      buildEmailMessageFromNotification(notification, input),
      toEmailProviderType(input.provider),
    );

    return mapEmailSendResultToNotificationResult(emailResult);
  }

  private async dispatchSmsNotification(
    notification: Notification,
    input: CreateNotificationInput,
  ) {
    if (!input.smsTo) {
      return {
        success: false,
        message: "SMS phone recipient is required",
      };
    }

    const smsResult = await this.smsService.sendSms(
      buildSmsMessageFromNotification(notification, input),
      toSmsProviderType(input.provider),
    );

    return mapSmsSendResultToNotificationResult(smsResult);
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
