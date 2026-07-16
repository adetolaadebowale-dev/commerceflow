import type {
  NotificationProvider,
  NotificationProviderType,
} from "@commerceflow/types";

import {
  NOTIFICATION_ERROR_CODES,
  NotificationError,
} from "../errors";

export interface NotificationProviderFactory {
  resolve(provider: NotificationProviderType): NotificationProvider;
}

export class DefaultNotificationProviderFactory
  implements NotificationProviderFactory
{
  constructor(
    private readonly providers: ReadonlyMap<
      NotificationProviderType,
      NotificationProvider
    >,
  ) {}

  resolve(provider: NotificationProviderType): NotificationProvider {
    const resolved = this.providers.get(provider);

    if (!resolved) {
      throw new NotificationError(
        NOTIFICATION_ERROR_CODES.UNSUPPORTED_PROVIDER,
        `Unsupported notification provider: ${provider}`,
        400,
      );
    }

    return resolved;
  }
}
