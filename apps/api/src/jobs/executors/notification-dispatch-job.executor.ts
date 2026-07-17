import type { Job } from "@commerceflow/types";
import type { CreateNotificationInput } from "@commerceflow/validation";

import type { NotificationService } from "@/notifications/services";
import {
  JOB_SIMULATE_FAILURE_KEY,
  type JobExecutionResult,
  type JobExecutor,
} from "./job-executor";

export type NotificationServiceResolver = () => Promise<NotificationService>;

export class NotificationDispatchJobExecutor implements JobExecutor {
  constructor(
    private readonly resolveNotificationService: NotificationServiceResolver = async () => {
      const { notificationService } = await import("@/notifications/services");
      return notificationService;
    },
  ) {}

  async execute(job: Job): Promise<JobExecutionResult> {
    if (job.payload[JOB_SIMULATE_FAILURE_KEY] === true) {
      return {
        success: false,
        message: "Simulated job failure",
      };
    }

    const notificationInput = job.payload.notificationInput as
      | CreateNotificationInput
      | undefined;

    if (!notificationInput) {
      return {
        success: false,
        message: "Notification dispatch payload is missing notificationInput",
      };
    }

    try {
      const notificationService = await this.resolveNotificationService();
      await notificationService.createNotification(notificationInput);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Notification dispatch failed",
      };
    }
  }
}

export const notificationDispatchJobExecutor =
  new NotificationDispatchJobExecutor();
