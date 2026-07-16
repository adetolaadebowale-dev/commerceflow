import { prisma } from "@/lib/prisma";

import { MemoryNotificationRepository } from "./memory-notification.repository";
import { PrismaNotificationRepository } from "./prisma-notification.repository";
import type { NotificationRepository } from "./notification.repository";

let notificationRepository: NotificationRepository | undefined;

export function getNotificationRepository(): NotificationRepository {
  if (!notificationRepository) {
    notificationRepository = new PrismaNotificationRepository(prisma);
  }

  return notificationRepository;
}

export {
  MemoryNotificationRepository,
  PrismaNotificationRepository,
  type NotificationRepository,
};
