import {
  Prisma,
  type PrismaClient,
  type Notification as PrismaNotification,
} from "@prisma/client";
import {
  buildCatalogueListResult,
  type Notification,
} from "@commerceflow/types";
import type {
  CreateNotificationInput,
  ListNotificationsQuery,
} from "@commerceflow/validation";

import type { NotificationRepository } from "./notification.repository";

function toMetadata(
  value: Prisma.JsonValue | null,
): Record<string, unknown> | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }

  if (typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return undefined;
}

function toNotification(record: PrismaNotification): Notification {
  return {
    id: record.id,
    storeId: record.storeId,
    userId: record.userId ?? undefined,
    customerId: record.customerId ?? undefined,
    channel: record.channel,
    status: record.status,
    subject: record.subject ?? undefined,
    title: record.title ?? undefined,
    body: record.body,
    metadata: toMetadata(record.metadata),
    sentAt: record.sentAt?.toISOString(),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function buildListWhere(
  query: ListNotificationsQuery,
): Prisma.NotificationWhereInput {
  return {
    storeId: query.storeId,
    ...(query.channel ? { channel: query.channel } : {}),
    ...(query.status ? { status: query.status } : {}),
    ...(query.userId ? { userId: query.userId } : {}),
    ...(query.customerId ? { customerId: query.customerId } : {}),
  };
}

export class PrismaNotificationRepository implements NotificationRepository {
  constructor(private readonly db: PrismaClient) {}

  async findById(storeId: string, id: string): Promise<Notification | null> {
    const record = await this.db.notification.findFirst({
      where: { id, storeId },
    });

    return record ? toNotification(record) : null;
  }

  async list(query: ListNotificationsQuery) {
    const where = buildListWhere(query);
    const skip = (query.page - 1) * query.limit;

    const [records, total] = await Promise.all([
      this.db.notification.findMany({
        where,
        orderBy: [{ createdAt: "desc" }, { id: "asc" }],
        skip,
        take: query.limit,
      }),
      this.db.notification.count({ where }),
    ]);

    return buildCatalogueListResult({
      items: records.map(toNotification),
      total,
      page: query.page,
      limit: query.limit,
    });
  }

  async create(input: CreateNotificationInput): Promise<Notification> {
    const record = await this.db.notification.create({
      data: {
        storeId: input.storeId,
        userId: input.userId,
        customerId: input.customerId,
        channel: input.channel,
        status: "pending",
        subject: input.subject,
        title: input.title,
        body: input.body.trim(),
        metadata:
          input.metadata === undefined
            ? undefined
            : (input.metadata as Prisma.InputJsonValue),
      },
    });

    return toNotification(record);
  }

  async markSent(
    storeId: string,
    id: string,
    sentAt: string,
  ): Promise<Notification> {
    const result = await this.db.notification.updateMany({
      where: { id, storeId, status: "pending" },
      data: {
        status: "sent",
        sentAt: new Date(sentAt),
      },
    });

    if (result.count === 0) {
      throw new Error(`Notification not found or not pending: ${id}`);
    }

    const record = await this.db.notification.findFirstOrThrow({
      where: { id, storeId },
    });

    return toNotification(record);
  }

  async markFailed(storeId: string, id: string): Promise<Notification> {
    const result = await this.db.notification.updateMany({
      where: { id, storeId, status: "pending" },
      data: { status: "failed" },
    });

    if (result.count === 0) {
      throw new Error(`Notification not found or not pending: ${id}`);
    }

    const record = await this.db.notification.findFirstOrThrow({
      where: { id, storeId },
    });

    return toNotification(record);
  }
}
