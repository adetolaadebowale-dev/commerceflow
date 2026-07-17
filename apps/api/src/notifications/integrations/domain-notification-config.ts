import type {
  DomainNotificationConfig,
  DomainNotificationEventType,
} from "@commerceflow/types";

/** Default channel configuration for core domain notification triggers. */
export const DEFAULT_DOMAIN_NOTIFICATION_CONFIG: DomainNotificationConfig = {
  "order.confirmed": {
    email: true,
  },
  "payment.paid": {
    email: true,
  },
  "payment.failed": {
    email: true,
    sms: true,
  },
  "shipment.shipped": {
    email: true,
    defer: true,
  },
  "shipment.delivered": {
    email: true,
  },
  "return.completed": {
    email: true,
  },
  "purchase-order.received": {
    email: true,
  },
};

export function getDomainNotificationConfig(
  overrides?: Partial<DomainNotificationConfig>,
): DomainNotificationConfig {
  if (!overrides) {
    return DEFAULT_DOMAIN_NOTIFICATION_CONFIG;
  }

  return {
    ...DEFAULT_DOMAIN_NOTIFICATION_CONFIG,
    ...overrides,
  } as DomainNotificationConfig;
}

export function isDomainNotificationEventType(
  eventType: string,
): eventType is DomainNotificationEventType {
  return eventType in DEFAULT_DOMAIN_NOTIFICATION_CONFIG;
}
