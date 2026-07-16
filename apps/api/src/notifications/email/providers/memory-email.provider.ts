import type {
  EmailMessage,
  EmailProvider,
  EmailProviderType,
  EmailSendResult,
} from "@commerceflow/types";

import { EMAIL_SIMULATE_FAILURE_KEY } from "./console-email.provider";

export interface MemoryEmailDelivery {
  readonly message: EmailMessage;
  readonly result: EmailSendResult;
  readonly deliveredAt: string;
}

/** In-memory email provider for automated tests and local development. */
export class MemoryEmailProvider implements EmailProvider {
  readonly provider: EmailProviderType = "memory";
  private readonly deliveries: MemoryEmailDelivery[] = [];

  async sendEmail(message: EmailMessage): Promise<EmailSendResult> {
    const result =
      message.metadata?.[EMAIL_SIMULATE_FAILURE_KEY] === true
        ? {
            success: false,
            message: "Memory email provider simulated failure",
            metadata: { simulated: true },
          }
        : {
            success: true,
            providerReference: `MEM-EMAIL-${message.notificationId.slice(0, 8).toUpperCase()}`,
            message: `Memory email provider delivered message to ${message.to.email}`,
            metadata: {
              simulated: true,
              recipient: message.to.email,
            },
          };

    this.deliveries.push({
      message,
      result,
      deliveredAt: new Date().toISOString(),
    });

    return result;
  }

  getDeliveries(): readonly MemoryEmailDelivery[] {
    return [...this.deliveries];
  }

  clearDeliveries(): void {
    this.deliveries.length = 0;
  }
}
