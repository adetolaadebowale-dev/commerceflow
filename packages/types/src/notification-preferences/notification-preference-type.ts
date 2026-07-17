/** Supported notification preference categories for Phase 5. */
export const NOTIFICATION_PREFERENCE_TYPES = [
  "order_updates",
  "payment_updates",
  "shipment_updates",
  "return_updates",
  "procurement_updates",
] as const;

export type NotificationPreferenceType =
  (typeof NOTIFICATION_PREFERENCE_TYPES)[number];
