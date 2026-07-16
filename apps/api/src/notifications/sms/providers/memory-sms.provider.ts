import type {
  SmsMessage,
  SmsProvider,
  SmsProviderType,
  SmsSendResult,
} from "@commerceflow/types";

import { SMS_SIMULATE_FAILURE_KEY } from "./console-sms.provider";

export interface MemorySmsDelivery {
  readonly message: SmsMessage;
  readonly result: SmsSendResult;
  readonly deliveredAt: string;
}

/** In-memory SMS provider for automated tests and local development. */
export class MemorySmsProvider implements SmsProvider {
  readonly provider: SmsProviderType = "memory";
  private readonly deliveries: MemorySmsDelivery[] = [];

  async sendSms(message: SmsMessage): Promise<SmsSendResult> {
    const result =
      message.metadata?.[SMS_SIMULATE_FAILURE_KEY] === true
        ? {
            success: false,
            message: "Memory SMS provider simulated failure",
            metadata: { simulated: true },
          }
        : {
            success: true,
            providerReference: `MEM-SMS-${message.notificationId.slice(0, 8).toUpperCase()}`,
            message: `Memory SMS provider delivered message to ${message.to.phone}`,
            metadata: {
              simulated: true,
              recipient: message.to.phone,
            },
          };

    this.deliveries.push({
      message,
      result,
      deliveredAt: new Date().toISOString(),
    });

    return result;
  }

  getDeliveries(): readonly MemorySmsDelivery[] {
    return [...this.deliveries];
  }

  clearDeliveries(): void {
    this.deliveries.length = 0;
  }
}
