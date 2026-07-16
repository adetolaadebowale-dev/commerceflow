import {
  buildCatalogueListResult,
  type Notification,
} from "@commerceflow/types";
import type {
  CreateNotificationInput,
  ListInAppNotificationsQuery,
  ListNotificationsQuery,
} from "@commerceflow/validation";

import type { NotificationRepository } from "./notification.repository";

export class MemoryNotificationRepository implements NotificationRepository {
  private readonly notificationsById = new Map<string, Notification>();
  private transactionFailure: Error | null = null;

  setTransactionFailure(error: Error | null): void {
    this.transactionFailure = error;
  }

  getNotificationCount(): number {
    return this.notificationsById.size;
  }

  async findById(storeId: string, id: string): Promise<Notification | null> {
    const notification = this.notificationsById.get(id);
    return notification?.storeId === storeId ? notification : null;
  }

  async list(query: ListNotificationsQuery) {
    let items = [...this.notificationsById.values()].filter(
      (notification) => notification.storeId === query.storeId,
    );

    if (query.channel) {
      items = items.filter(
        (notification) => notification.channel === query.channel,
      );
    }

    if (query.status) {
      items = items.filter(
        (notification) => notification.status === query.status,
      );
    }

    if (query.userId) {
      items = items.filter(
        (notification) => notification.userId === query.userId,
      );
    }

    if (query.customerId) {
      items = items.filter(
        (notification) => notification.customerId === query.customerId,
      );
    }

    items.sort(
      (left, right) =>
        right.createdAt.localeCompare(left.createdAt) ||
        left.id.localeCompare(right.id),
    );

    const total = items.length;
    const start = (query.page - 1) * query.limit;
    const paged = items.slice(start, start + query.limit);

    return buildCatalogueListResult({
      items: paged,
      total,
      page: query.page,
      limit: query.limit,
    });
  }

  async listInApp(query: ListInAppNotificationsQuery) {
    let items = [...this.notificationsById.values()].filter(
      (notification) =>
        notification.storeId === query.storeId &&
        notification.userId === query.userId &&
        notification.channel === "in_app" &&
        notification.status === "sent",
    );

    if (query.unreadOnly) {
      items = items.filter((notification) => !notification.readAt);
    }

    items.sort(
      (left, right) =>
        right.createdAt.localeCompare(left.createdAt) ||
        left.id.localeCompare(right.id),
    );

    const total = items.length;
    const start = (query.page - 1) * query.limit;
    const paged = items.slice(start, start + query.limit);

    return buildCatalogueListResult({
      items: paged,
      total,
      page: query.page,
      limit: query.limit,
    });
  }

  async create(input: CreateNotificationInput): Promise<Notification> {
    if (this.transactionFailure) {
      throw this.transactionFailure;
    }

    const now = new Date().toISOString();
    const notification: Notification = {
      id: crypto.randomUUID(),
      storeId: input.storeId,
      userId: input.userId,
      customerId: input.customerId,
      channel: input.channel,
      status: "pending",
      subject: input.subject,
      title: input.title,
      body: input.body.trim(),
      metadata: input.metadata,
      createdAt: now,
      updatedAt: now,
    };

    this.notificationsById.set(notification.id, notification);
    return notification;
  }

  async markSent(
    storeId: string,
    id: string,
    sentAt: string,
  ): Promise<Notification> {
    if (this.transactionFailure) {
      throw this.transactionFailure;
    }

    const existing = await this.findById(storeId, id);

    if (!existing || existing.status !== "pending") {
      throw new Error(`Notification not found or not pending: ${id}`);
    }

    const updated: Notification = {
      ...existing,
      status: "sent",
      sentAt,
      updatedAt: new Date().toISOString(),
    };

    this.notificationsById.set(id, updated);
    return updated;
  }

  async markFailed(storeId: string, id: string): Promise<Notification> {
    if (this.transactionFailure) {
      throw this.transactionFailure;
    }

    const existing = await this.findById(storeId, id);

    if (!existing || existing.status !== "pending") {
      throw new Error(`Notification not found or not pending: ${id}`);
    }

    const updated: Notification = {
      ...existing,
      status: "failed",
      updatedAt: new Date().toISOString(),
    };

    this.notificationsById.set(id, updated);
    return updated;
  }

  async markRead(
    storeId: string,
    id: string,
    readAt: string,
  ): Promise<Notification> {
    if (this.transactionFailure) {
      throw this.transactionFailure;
    }

    const existing = await this.findById(storeId, id);

    if (
      !existing ||
      existing.channel !== "in_app" ||
      existing.status !== "sent"
    ) {
      throw new Error(`In-app notification not found: ${id}`);
    }

    const updated: Notification = {
      ...existing,
      readAt,
      updatedAt: new Date().toISOString(),
    };

    this.notificationsById.set(id, updated);
    return updated;
  }

  async markUnread(storeId: string, id: string): Promise<Notification> {
    if (this.transactionFailure) {
      throw this.transactionFailure;
    }

    const existing = await this.findById(storeId, id);

    if (
      !existing ||
      existing.channel !== "in_app" ||
      existing.status !== "sent"
    ) {
      throw new Error(`In-app notification not found: ${id}`);
    }

    const updated: Notification = {
      ...existing,
      readAt: undefined,
      updatedAt: new Date().toISOString(),
    };

    this.notificationsById.set(id, updated);
    return updated;
  }
}
