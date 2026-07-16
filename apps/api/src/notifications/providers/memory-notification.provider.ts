import type {
  NotificationProvider,
  NotificationProviderType,
  NotificationResult,
  NotificationSendRequest,
} from "@commerceflow/types";

import { NOTIFICATION_SIMULATE_FAILURE_KEY } from "./console-notification.provider";

export interface MemoryNotificationDelivery {
  readonly request: NotificationSendRequest;
  readonly result: NotificationResult;
  readonly deliveredAt: string;
}

/** In-memory provider for automated tests and local development. */
export class MemoryNotificationProvider implements NotificationProvider {
  readonly provider: NotificationProviderType = "memory";
  private readonly deliveries: MemoryNotificationDelivery[] = [];

  async send(request: NotificationSendRequest): Promise<NotificationResult> {
    const result =
      request.metadata?.[NOTIFICATION_SIMULATE_FAILURE_KEY] === true
        ? {
            success: false,
            message: "Memory provider simulated failure",
            metadata: { simulated: true },
          }
        : {
            success: true,
            providerReference: `MEM-${request.notificationId.slice(0, 8).toUpperCase()}`,
            message: `Memory provider delivered ${request.channel} notification`,
            metadata: {
              simulated: true,
              channel: request.channel,
            },
          };

    this.deliveries.push({
      request,
      result,
      deliveredAt: new Date().toISOString(),
    });

    return result;
  }

  getDeliveries(): readonly MemoryNotificationDelivery[] {
    return [...this.deliveries];
  }

  clearDeliveries(): void {
    this.deliveries.length = 0;
  }
}
