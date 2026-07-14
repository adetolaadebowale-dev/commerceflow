import {
  buildCatalogueListResult,
  type AuditLog,
} from "@commerceflow/types";
import type { ListAuditLogsQuery } from "@commerceflow/validation";

import type {
  AuditLogRepository,
  CreateAuditLogInput,
} from "./audit-log.repository";

export class MemoryAuditLogRepository implements AuditLogRepository {
  private readonly logsById = new Map<string, AuditLog>();
  private createFailure: Error | null = null;

  async create(input: CreateAuditLogInput): Promise<AuditLog> {
    if (this.createFailure) {
      throw this.createFailure;
    }

    const log: AuditLog = {
      id: crypto.randomUUID(),
      storeId: input.storeId,
      userId: input.userId,
      sessionId: input.sessionId,
      entityType: input.entityType,
      entityId: input.entityId,
      action: input.action,
      metadata: input.metadata ?? null,
      createdAt: new Date().toISOString(),
    };

    this.logsById.set(log.id, log);
    return log;
  }

  async findById(storeId: string, id: string): Promise<AuditLog | null> {
    const log = this.logsById.get(id);
    return log?.storeId === storeId ? log : null;
  }

  async list(query: ListAuditLogsQuery) {
    let items = [...this.logsById.values()].filter(
      (log) => log.storeId === query.storeId,
    );

    if (query.entityType) {
      items = items.filter((log) => log.entityType === query.entityType);
    }

    if (query.entityId) {
      items = items.filter((log) => log.entityId === query.entityId);
    }

    if (query.userId) {
      items = items.filter((log) => log.userId === query.userId);
    }

    if (query.action) {
      items = items.filter((log) => log.action === query.action);
    }

    if (query.fromDate) {
      const from = new Date(query.fromDate).getTime();
      items = items.filter(
        (log) => new Date(log.createdAt).getTime() >= from,
      );
    }

    if (query.toDate) {
      const to = new Date(query.toDate).getTime();
      items = items.filter((log) => new Date(log.createdAt).getTime() <= to);
    }

    items.sort(
      (left, right) =>
        new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
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

  seedLog(log: AuditLog): void {
    this.logsById.set(log.id, log);
  }

  setCreateFailure(error: Error | null): void {
    this.createFailure = error;
  }

  getAll(): readonly AuditLog[] {
    return [...this.logsById.values()];
  }
}
