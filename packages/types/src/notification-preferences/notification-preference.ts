import type { NotificationPreferenceType } from "./notification-preference-type";

/** Default channel enablement when no persisted preference exists. */
export const DEFAULT_NOTIFICATION_PREFERENCE_CHANNELS = {
  emailEnabled: true,
  smsEnabled: true,
  inAppEnabled: true,
} as const;

/** Store-scoped notification channel preferences for a user and category. */
export interface NotificationPreference {
  readonly id: string;
  readonly storeId: string;
  readonly userId: string;
  readonly notificationType: NotificationPreferenceType;
  readonly emailEnabled: boolean;
  readonly smsEnabled: boolean;
  readonly inAppEnabled: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

/** Effective preference values returned by the API (defaults merged). */
export interface NotificationPreferenceView {
  readonly notificationType: NotificationPreferenceType;
  readonly emailEnabled: boolean;
  readonly smsEnabled: boolean;
  readonly inAppEnabled: boolean;
  readonly id?: string;
  readonly updatedAt?: string;
}
