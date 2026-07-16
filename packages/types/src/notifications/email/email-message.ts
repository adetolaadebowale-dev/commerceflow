import type { EmailRecipient } from "./email-recipient";

/** Plain-text email payload for provider delivery. */
export interface EmailMessage {
  readonly storeId: string;
  readonly notificationId: string;
  readonly to: EmailRecipient;
  readonly subject: string;
  readonly body: string;
  readonly metadata?: Record<string, unknown>;
}
