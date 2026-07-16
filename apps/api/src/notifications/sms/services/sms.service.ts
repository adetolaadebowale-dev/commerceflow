import type {
  SmsMessage,
  SmsProviderType,
  SmsSendResult,
} from "@commerceflow/types";

import {
  getDomainEventPublisher,
  type DomainEventPublisher,
} from "@/domain-events";
import {
  getSmsProviderFactory,
  type SmsProviderFactory,
} from "../providers";

export interface SmsServiceDependencies {
  readonly smsProviderFactory?: SmsProviderFactory;
  readonly domainEventPublisher?: DomainEventPublisher;
}

export class SmsService {
  private readonly smsProviderFactory: SmsProviderFactory;
  private readonly domainEventPublisher: DomainEventPublisher;

  constructor(dependencies: SmsServiceDependencies = {}) {
    this.smsProviderFactory =
      dependencies.smsProviderFactory ?? getSmsProviderFactory();
    this.domainEventPublisher =
      dependencies.domainEventPublisher ?? getDomainEventPublisher();
  }

  async sendSms(
    message: SmsMessage,
    providerType: SmsProviderType = "console",
  ): Promise<SmsSendResult> {
    const provider = this.smsProviderFactory.resolve(providerType);
    const result = await provider.sendSms(message);

    if (result.success) {
      this.domainEventPublisher.publishSmsSent(message, result);
    } else {
      this.domainEventPublisher.publishSmsFailed(message, result);
    }

    return result;
  }
}

export const smsService = new SmsService();
