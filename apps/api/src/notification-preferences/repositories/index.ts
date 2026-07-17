import { prisma } from "@/lib/prisma";

import type { NotificationPreferenceRepository } from "./notification-preference.repository";
import { PrismaNotificationPreferenceRepository } from "./prisma-notification-preference.repository";

let notificationPreferenceRepository:
  | NotificationPreferenceRepository
  | undefined;

export function getNotificationPreferenceRepository(): NotificationPreferenceRepository {
  if (!notificationPreferenceRepository) {
    notificationPreferenceRepository = new PrismaNotificationPreferenceRepository(
      prisma,
    );
  }

  return notificationPreferenceRepository;
}

export { MemoryNotificationPreferenceRepository } from "./memory-notification-preference.repository";
export type { NotificationPreferenceRepository } from "./notification-preference.repository";
export { PrismaNotificationPreferenceRepository } from "./prisma-notification-preference.repository";
