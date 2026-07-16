import type { SmsMessage } from "./sms-message";
import type { SmsProviderType } from "./sms-provider-type";
import type { SmsSendResult } from "./sms-send-result";

/** Provider-agnostic plain-text SMS delivery contract. */
export interface SmsProvider {
  readonly provider: SmsProviderType;

  sendSms(message: SmsMessage): Promise<SmsSendResult>;
}
