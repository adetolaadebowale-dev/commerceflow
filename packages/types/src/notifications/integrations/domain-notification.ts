import type { NotificationChannel } from "../notification-channel";

/** Domain events that trigger customer or supplier notifications. */
export const DOMAIN_NOTIFICATION_EVENT_TYPES = [
  "order.confirmed",
  "payment.paid",
  "payment.failed",
  "shipment.shipped",
  "shipment.delivered",
  "return.completed",
  "purchase-order.received",
] as const;

export type DomainNotificationEventType =
  (typeof DOMAIN_NOTIFICATION_EVENT_TYPES)[number];

/** Per-channel enablement for a domain notification trigger. */
export interface DomainNotificationChannelConfig {
  readonly email?: boolean;
  readonly sms?: boolean;
  readonly in_app?: boolean;
  readonly defer?: boolean;
  readonly userId?: string;
}

export type DomainNotificationConfig = Readonly<
  Record<DomainNotificationEventType, DomainNotificationChannelConfig>
>;

export interface DomainNotificationDispatchItem {
  readonly channel: NotificationChannel;
  readonly notificationId?: string;
  readonly jobId?: string;
  readonly deferred: boolean;
}

/** Result of dispatching notifications for a domain event. */
export interface DomainNotificationDispatchResult {
  readonly sourceEventType: DomainNotificationEventType;
  readonly sourceAggregateId: string;
  readonly storeId: string;
  readonly dispatches: readonly DomainNotificationDispatchItem[];
}

export interface OrderCustomerContact {
  readonly customerId?: string;
  readonly userId?: string;
  readonly email?: string;
  readonly phone?: string;
  readonly name?: string;
}

export interface SupplierContactInfo {
  readonly supplierId: string;
  readonly email?: string;
  readonly phone?: string;
  readonly name?: string;
}
