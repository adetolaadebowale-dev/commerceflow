import type { SmsProvider } from "@commerceflow/types";

import { ConsoleSmsProvider } from "./console-sms.provider";
import { MemorySmsProvider } from "./memory-sms.provider";
import {
  DefaultSmsProviderFactory,
  type SmsProviderFactory,
} from "./sms-provider.factory";

const consoleSmsProvider: SmsProvider = new ConsoleSmsProvider();
const memorySmsProvider: SmsProvider = new MemorySmsProvider();

const smsProviderFactory: SmsProviderFactory = new DefaultSmsProviderFactory(
  new Map([
    ["console", consoleSmsProvider],
    ["memory", memorySmsProvider],
  ]),
);

export function getSmsProviderFactory(): SmsProviderFactory {
  return smsProviderFactory;
}

export type { SmsProviderFactory } from "./sms-provider.factory";
export { ConsoleSmsProvider } from "./console-sms.provider";
export { MemorySmsProvider } from "./memory-sms.provider";
export { DefaultSmsProviderFactory } from "./sms-provider.factory";
