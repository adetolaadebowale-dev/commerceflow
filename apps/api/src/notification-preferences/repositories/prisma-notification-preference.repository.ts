import {
  type NotificationPreferenceType as PrismaNotificationPreferenceType,
  type PrismaClient,
  type NotificationPreference as PrismaNotificationPreference,
} from "@prisma/client";
import type { NotificationPreference } from "@commerceflow/types";

import type { NotificationPreferenceRepository } from "./notification-preference.repository";

function toNotificationPreference(
  record: PrismaNotificationPreference,
): NotificationPreference {
  return {
    id: record.id,
    storeId: record.storeId,
    userId: record.userId,
    notificationType: record.notificationType,
    emailEnabled: record.emailEnabled,
    smsEnabled: record.smsEnabled,
    inAppEnabled: record.inAppEnabled,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export class PrismaNotificationPreferenceRepository
  implements NotificationPreferenceRepository
{
  constructor(private readonly db: PrismaClient) {}

  async findByStoreUserAndType(
    storeId: string,
    userId: string,
    notificationType: PrismaNotificationPreferenceType,
  ): Promise<NotificationPreference | null> {
    const record = await this.db.notificationPreference.findFirst({
      where: { storeId, userId, notificationType },
    });

    return record ? toNotificationPreference(record) : null;
  }

  async listByStoreAndUser(
    storeId: string,
    userId: string,
  ): Promise<readonly NotificationPreference[]> {
    const records = await this.db.notificationPreference.findMany({
      where: { storeId, userId },
      orderBy: [{ notificationType: "asc" }],
    });

    return records.map(toNotificationPreference);
  }

  async upsert(
    storeId: string,
    userId: string,
    notificationType: PrismaNotificationPreferenceType,
    input: {
      emailEnabled: boolean;
      smsEnabled: boolean;
      inAppEnabled: boolean;
    },
  ): Promise<NotificationPreference> {
    const record = await this.db.notificationPreference.upsert({
      where: {
        storeId_userId_notificationType: {
          storeId,
          userId,
          notificationType,
        },
      },
      create: {
        storeId,
        userId,
        notificationType,
        emailEnabled: input.emailEnabled,
        smsEnabled: input.smsEnabled,
        inAppEnabled: input.inAppEnabled,
      },
      update: {
        emailEnabled: input.emailEnabled,
        smsEnabled: input.smsEnabled,
        inAppEnabled: input.inAppEnabled,
      },
    });

    return toNotificationPreference(record);
  }
}
