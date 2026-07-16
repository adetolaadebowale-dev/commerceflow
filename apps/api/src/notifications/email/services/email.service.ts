import type {
  EmailMessage,
  EmailProviderType,
  EmailSendResult,
} from "@commerceflow/types";

import {
  getDomainEventPublisher,
  type DomainEventPublisher,
} from "@/domain-events";
import {
  getEmailProviderFactory,
  type EmailProviderFactory,
} from "../providers";

export interface EmailServiceDependencies {
  readonly emailProviderFactory?: EmailProviderFactory;
  readonly domainEventPublisher?: DomainEventPublisher;
}

export class EmailService {
  private readonly emailProviderFactory: EmailProviderFactory;
  private readonly domainEventPublisher: DomainEventPublisher;

  constructor(dependencies: EmailServiceDependencies = {}) {
    this.emailProviderFactory =
      dependencies.emailProviderFactory ?? getEmailProviderFactory();
    this.domainEventPublisher =
      dependencies.domainEventPublisher ?? getDomainEventPublisher();
  }

  async sendEmail(
    message: EmailMessage,
    providerType: EmailProviderType = "console",
  ): Promise<EmailSendResult> {
    const provider = this.emailProviderFactory.resolve(providerType);
    const result = await provider.sendEmail(message);

    if (result.success) {
      this.domainEventPublisher.publishEmailSent(message, result);
    } else {
      this.domainEventPublisher.publishEmailFailed(message, result);
    }

    return result;
  }
}

export const emailService = new EmailService();
