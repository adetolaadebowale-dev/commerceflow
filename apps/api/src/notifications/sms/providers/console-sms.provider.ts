import type {
  SmsMessage,
  SmsProvider,
  SmsProviderType,
  SmsSendResult,
} from "@commerceflow/types";

const SIMULATE_FAILURE_KEY = "simulateProviderFailure";

function buildSuccessResult(message: SmsMessage): SmsSendResult {
  return {
    success: true,
    providerReference: `CONSOLE-SMS-${message.notificationId.slice(0, 8).toUpperCase()}`,
    message: `Console SMS provider delivered message to ${message.to.phone}`,
    metadata: {
      simulated: true,
      recipient: message.to.phone,
    },
  };
}

function buildFailureResult(): SmsSendResult {
  return {
    success: false,
    message: "Console SMS provider simulated failure",
    metadata: {
      simulated: true,
    },
  };
}

function shouldSimulateFailure(metadata?: Record<string, unknown>): boolean {
  return metadata?.[SIMULATE_FAILURE_KEY] === true;
}

/** Development SMS provider that logs plain-text payloads without outbound I/O. */
export class ConsoleSmsProvider implements SmsProvider {
  readonly provider: SmsProviderType = "console";

  async sendSms(message: SmsMessage): Promise<SmsSendResult> {
    if (shouldSimulateFailure(message.metadata)) {
      return buildFailureResult();
    }

    console.info("[ConsoleSmsProvider]", {
      notificationId: message.notificationId,
      storeId: message.storeId,
      to: message.to.phone,
    });

    return buildSuccessResult(message);
  }
}

export { SIMULATE_FAILURE_KEY as SMS_SIMULATE_FAILURE_KEY };
