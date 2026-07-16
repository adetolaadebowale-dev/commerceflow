import type { NotificationProvider } from "@commerceflow/types";

import { ConsoleNotificationProvider } from "./console-notification.provider";
import { MemoryNotificationProvider } from "./memory-notification.provider";
import {
  DefaultNotificationProviderFactory,
  type NotificationProviderFactory,
} from "./notification-provider.factory";

const consoleProvider: NotificationProvider = new ConsoleNotificationProvider();
const memoryProvider: NotificationProvider = new MemoryNotificationProvider();

const notificationProviderFactory: NotificationProviderFactory =
  new DefaultNotificationProviderFactory(
    new Map([
      ["console", consoleProvider],
      ["memory", memoryProvider],
    ]),
  );

export function getNotificationProviderFactory(): NotificationProviderFactory {
  return notificationProviderFactory;
}

export type { NotificationProviderFactory } from "./notification-provider.factory";
export { ConsoleNotificationProvider } from "./console-notification.provider";
export { MemoryNotificationProvider } from "./memory-notification.provider";
export { DefaultNotificationProviderFactory } from "./notification-provider.factory";
