import type { SmsProvider, SmsProviderType } from "@commerceflow/types";

import { SMS_ERROR_CODES, SmsError } from "../errors";

export interface SmsProviderFactory {
  resolve(provider: SmsProviderType): SmsProvider;
}

export class DefaultSmsProviderFactory implements SmsProviderFactory {
  constructor(
    private readonly providers: ReadonlyMap<SmsProviderType, SmsProvider>,
  ) {}

  resolve(provider: SmsProviderType): SmsProvider {
    const resolved = this.providers.get(provider);

    if (!resolved) {
      throw new SmsError(
        SMS_ERROR_CODES.UNSUPPORTED_PROVIDER,
        `Unsupported SMS provider: ${provider}`,
        400,
      );
    }

    return resolved;
  }
}
