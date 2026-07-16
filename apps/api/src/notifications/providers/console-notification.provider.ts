import type {
  NotificationProvider,
  NotificationProviderType,
  NotificationResult,
  NotificationSendRequest,
} from "@commerceflow/types";

const SIMULATE_FAILURE_KEY = "simulateProviderFailure";

function buildSuccessResult(
  request: NotificationSendRequest,
): NotificationResult {
  return {
    success: true,
    providerReference: `CONSOLE-${request.notificationId.slice(0, 8).toUpperCase()}`,
    message: `Console provider delivered ${request.channel} notification`,
    metadata: {
      simulated: true,
      channel: request.channel,
    },
  };
}

function buildFailureResult(): NotificationResult {
  return {
    success: false,
    message: "Console provider simulated failure",
    metadata: {
      simulated: true,
    },
  };
}

function shouldSimulateFailure(
  metadata?: Record<string, unknown>,
): boolean {
  return metadata?.[SIMULATE_FAILURE_KEY] === true;
}

/** Development provider that logs notification payloads without outbound I/O. */
export class ConsoleNotificationProvider implements NotificationProvider {
  readonly provider: NotificationProviderType = "console";

  async send(request: NotificationSendRequest): Promise<NotificationResult> {
    if (shouldSimulateFailure(request.metadata)) {
      return buildFailureResult();
    }

    console.info("[ConsoleNotificationProvider]", {
      notificationId: request.notificationId,
      storeId: request.storeId,
      channel: request.channel,
      subject: request.subject,
      title: request.title,
    });

    return buildSuccessResult(request);
  }
}

export { SIMULATE_FAILURE_KEY as NOTIFICATION_SIMULATE_FAILURE_KEY };
