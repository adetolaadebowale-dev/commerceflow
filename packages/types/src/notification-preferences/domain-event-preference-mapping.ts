import type { DomainNotificationEventType } from "../notifications/integrations/domain-notification";
import type { NotificationPreferenceType } from "./notification-preference-type";

/** Maps domain notification events to preference categories. */
export const DOMAIN_EVENT_TO_NOTIFICATION_PREFERENCE_TYPE: Readonly<
  Record<DomainNotificationEventType, NotificationPreferenceType>
> = {
  "order.confirmed": "order_updates",
  "payment.paid": "payment_updates",
  "payment.failed": "payment_updates",
  "shipment.shipped": "shipment_updates",
  "shipment.delivered": "shipment_updates",
  "return.completed": "return_updates",
  "purchase-order.received": "procurement_updates",
};
