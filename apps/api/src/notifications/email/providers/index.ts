import type { EmailProvider } from "@commerceflow/types";

import { ConsoleEmailProvider } from "./console-email.provider";
import {
  DefaultEmailProviderFactory,
  type EmailProviderFactory,
} from "./email-provider.factory";
import { MemoryEmailProvider } from "./memory-email.provider";

const consoleEmailProvider: EmailProvider = new ConsoleEmailProvider();
const memoryEmailProvider: EmailProvider = new MemoryEmailProvider();

const emailProviderFactory: EmailProviderFactory =
  new DefaultEmailProviderFactory(
    new Map([
      ["console", consoleEmailProvider],
      ["memory", memoryEmailProvider],
    ]),
  );

export function getEmailProviderFactory(): EmailProviderFactory {
  return emailProviderFactory;
}

export type { EmailProviderFactory } from "./email-provider.factory";
export { ConsoleEmailProvider } from "./console-email.provider";
export { MemoryEmailProvider } from "./memory-email.provider";
export { DefaultEmailProviderFactory } from "./email-provider.factory";
