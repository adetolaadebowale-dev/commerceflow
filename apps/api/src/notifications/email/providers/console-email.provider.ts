import type {
  EmailMessage,
  EmailProvider,
  EmailProviderType,
  EmailSendResult,
} from "@commerceflow/types";

const SIMULATE_FAILURE_KEY = "simulateProviderFailure";

function buildSuccessResult(message: EmailMessage): EmailSendResult {
  return {
    success: true,
    providerReference: `CONSOLE-EMAIL-${message.notificationId.slice(0, 8).toUpperCase()}`,
    message: `Console email provider delivered message to ${message.to.email}`,
    metadata: {
      simulated: true,
      recipient: message.to.email,
    },
  };
}

function buildFailureResult(): EmailSendResult {
  return {
    success: false,
    message: "Console email provider simulated failure",
    metadata: {
      simulated: true,
    },
  };
}

function shouldSimulateFailure(metadata?: Record<string, unknown>): boolean {
  return metadata?.[SIMULATE_FAILURE_KEY] === true;
}

/** Development email provider that logs plain-text payloads without outbound I/O. */
export class ConsoleEmailProvider implements EmailProvider {
  readonly provider: EmailProviderType = "console";

  async sendEmail(message: EmailMessage): Promise<EmailSendResult> {
    if (shouldSimulateFailure(message.metadata)) {
      return buildFailureResult();
    }

    console.info("[ConsoleEmailProvider]", {
      notificationId: message.notificationId,
      storeId: message.storeId,
      to: message.to.email,
      subject: message.subject,
    });

    return buildSuccessResult(message);
  }
}

export { SIMULATE_FAILURE_KEY as EMAIL_SIMULATE_FAILURE_KEY };
