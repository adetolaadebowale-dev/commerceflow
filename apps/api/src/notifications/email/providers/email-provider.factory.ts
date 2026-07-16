import type { EmailProvider, EmailProviderType } from "@commerceflow/types";

import { EMAIL_ERROR_CODES, EmailError } from "../errors";

export interface EmailProviderFactory {
  resolve(provider: EmailProviderType): EmailProvider;
}

export class DefaultEmailProviderFactory implements EmailProviderFactory {
  constructor(
    private readonly providers: ReadonlyMap<EmailProviderType, EmailProvider>,
  ) {}

  resolve(provider: EmailProviderType): EmailProvider {
    const resolved = this.providers.get(provider);

    if (!resolved) {
      throw new EmailError(
        EMAIL_ERROR_CODES.UNSUPPORTED_PROVIDER,
        `Unsupported email provider: ${provider}`,
        400,
      );
    }

    return resolved;
  }
}
