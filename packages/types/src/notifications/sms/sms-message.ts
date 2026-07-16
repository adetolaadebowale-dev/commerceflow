import type { SmsRecipient } from "./sms-recipient";

/** Plain-text SMS payload for provider delivery. */
export interface SmsMessage {
  readonly storeId: string;
  readonly notificationId: string;
  readonly to: SmsRecipient;
  readonly body: string;
  readonly metadata?: Record<string, unknown>;
}
