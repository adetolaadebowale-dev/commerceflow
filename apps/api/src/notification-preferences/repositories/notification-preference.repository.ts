import type {
  NotificationPreference,
  NotificationPreferenceType,
} from "@commerceflow/types";
import type { UpdateNotificationPreferenceInput } from "@commerceflow/validation";

export interface NotificationPreferenceRepository {
  findByStoreUserAndType(
    storeId: string,
    userId: string,
    notificationType: NotificationPreferenceType,
  ): Promise<NotificationPreference | null>;

  listByStoreAndUser(
    storeId: string,
    userId: string,
  ): Promise<readonly NotificationPreference[]>;

  upsert(
    storeId: string,
    userId: string,
    notificationType: NotificationPreferenceType,
    input: Pick<
      UpdateNotificationPreferenceInput,
      "emailEnabled" | "smsEnabled" | "inAppEnabled"
    >,
  ): Promise<NotificationPreference>;
}
