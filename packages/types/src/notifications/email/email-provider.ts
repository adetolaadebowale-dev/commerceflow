import type { EmailMessage } from "./email-message";
import type { EmailProviderType } from "./email-provider-type";
import type { EmailSendResult } from "./email-send-result";

/** Provider-agnostic plain-text email delivery contract. */
export interface EmailProvider {
  readonly provider: EmailProviderType;

  sendEmail(message: EmailMessage): Promise<EmailSendResult>;
}
