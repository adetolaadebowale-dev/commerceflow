import type {
  DomainNotificationConfig,
  DomainNotificationDispatchItem,
  DomainNotificationDispatchResult,
  DomainNotificationEventType,
} from "@commerceflow/types";
import type { CreateNotificationInput } from "@commerceflow/validation";

import { auditService } from "@/audit/services";
import type { JobService } from "@/jobs/services";
import type { NotificationService } from "../../services";
import {
  getDomainNotificationConfig,
} from "../domain-notification-config";

export const DOMAIN_NOTIFICATION_SYSTEM_USER_ID =
  "00000000-0000-0000-0000-000000000001";
export const DOMAIN_NOTIFICATION_SYSTEM_SESSION_ID =
  "00000000-0000-0000-0000-000000000002";

export interface DomainNotificationDispatchRequest {
  readonly storeId: string;
  readonly sourceEventType: DomainNotificationEventType;
  readonly sourceAggregateId: string;
  readonly notifications: readonly CreateNotificationInput[];
}

export interface DomainNotificationServiceDependencies {
  readonly notificationService?: NotificationService;
  readonly jobService?: JobService;
  readonly config?: DomainNotificationConfig;
}

export class DomainNotificationService {
  private readonly notificationService?: NotificationService;
  private readonly jobService?: JobService;
  private readonly config: DomainNotificationConfig;

  constructor(dependencies: DomainNotificationServiceDependencies = {}) {
    this.notificationService = dependencies.notificationService;
    this.jobService = dependencies.jobService;
    this.config =
      dependencies.config ?? getDomainNotificationConfig();
  }

  private async resolveNotificationService(): Promise<NotificationService> {
    if (this.notificationService) {
      return this.notificationService;
    }

    const { notificationService } = await import("@/notifications/services");
    return notificationService;
  }

  private async resolveJobService(): Promise<JobService> {
    if (this.jobService) {
      return this.jobService;
    }

    const { jobService } = await import("@/jobs/services");
    return jobService;
  }

  getConfig(): DomainNotificationConfig {
    return this.config;
  }

  async dispatch(
    request: DomainNotificationDispatchRequest,
  ): Promise<DomainNotificationDispatchResult> {
    const channelConfig = this.config[request.sourceEventType];
    const dispatches: DomainNotificationDispatchItem[] = [];

    for (const notificationInput of request.notifications) {
      if (channelConfig.defer) {
        const job = await (await this.resolveJobService()).createJob({
          storeId: request.storeId,
          type: "notification.dispatch",
          payload: {
            notificationInput,
            sourceEventType: request.sourceEventType,
            sourceAggregateId: request.sourceAggregateId,
          },
        });

        dispatches.push({
          channel: notificationInput.channel,
          deferred: true,
          jobId: job.id,
        });

        await this.recordDispatchAudit({
          storeId: request.storeId,
          sourceEventType: request.sourceEventType,
          sourceAggregateId: request.sourceAggregateId,
          channel: notificationInput.channel,
          jobId: job.id,
          deferred: true,
        });
        continue;
      }

      const notification = await (
        await this.resolveNotificationService()
      ).createNotification(notificationInput);

      dispatches.push({
        channel: notificationInput.channel,
        deferred: false,
        notificationId: notification.id,
      });

      await this.recordDispatchAudit({
        storeId: request.storeId,
        sourceEventType: request.sourceEventType,
        sourceAggregateId: request.sourceAggregateId,
        channel: notificationInput.channel,
        notificationId: notification.id,
        deferred: false,
      });
    }

    return {
      sourceEventType: request.sourceEventType,
      sourceAggregateId: request.sourceAggregateId,
      storeId: request.storeId,
      dispatches,
    };
  }

  private async recordDispatchAudit(input: {
    storeId: string;
    sourceEventType: DomainNotificationEventType;
    sourceAggregateId: string;
    channel: string;
    notificationId?: string;
    jobId?: string;
    deferred: boolean;
  }): Promise<void> {
    await auditService.recordBestEffort({
      storeId: input.storeId,
      userId: DOMAIN_NOTIFICATION_SYSTEM_USER_ID,
      sessionId: DOMAIN_NOTIFICATION_SYSTEM_SESSION_ID,
      entityType: "domain_notification",
      entityId: input.notificationId ?? input.jobId ?? input.sourceAggregateId,
      action: "dispatch",
      metadata: {
        sourceEventType: input.sourceEventType,
        sourceAggregateId: input.sourceAggregateId,
        channel: input.channel,
        notificationId: input.notificationId,
        jobId: input.jobId,
        deferred: input.deferred,
      },
    });
  }
}

export const domainNotificationService = new DomainNotificationService();
