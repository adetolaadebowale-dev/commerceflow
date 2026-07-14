import {
  Prisma,
  type PrismaClient,
} from "@prisma/client";
import {
  buildCatalogueListResult,
  type AuditLog,
  type CatalogueListResult,
} from "@commerceflow/types";
import type { ListAuditLogsQuery } from "@commerceflow/validation";

import type {
  AuditLogRepository,
  CreateAuditLogInput,
} from "./audit-log.repository";

function toAuditLog(record: {
  id: string;
  storeId: string | null;
  userId: string;
  sessionId: string;
  entityType: string;
  entityId: string;
  action: string;
  metadata: Prisma.JsonValue | null;
  createdAt: Date;
}): AuditLog {
  return {
    id: record.id,
    storeId: record.storeId,
    userId: record.userId,
    sessionId: record.sessionId,
    entityType: record.entityType as AuditLog["entityType"],
    entityId: record.entityId,
    action: record.action as AuditLog["action"],
    metadata:
      record.metadata && typeof record.metadata === "object"
        ? (record.metadata as Record<string, unknown>)
        : null,
    createdAt: record.createdAt.toISOString(),
  };
}

function buildListWhere(query: ListAuditLogsQuery): Prisma.AuditLogWhereInput {
  return {
    storeId: query.storeId,
    ...(query.entityType ? { entityType: query.entityType } : {}),
    ...(query.entityId ? { entityId: query.entityId } : {}),
    ...(query.userId ? { userId: query.userId } : {}),
    ...(query.action ? { action: query.action } : {}),
    ...(query.fromDate || query.toDate
      ? {
          createdAt: {
            ...(query.fromDate ? { gte: new Date(query.fromDate) } : {}),
            ...(query.toDate ? { lte: new Date(query.toDate) } : {}),
          },
        }
      : {}),
  };
}

export class PrismaAuditLogRepository implements AuditLogRepository {
  constructor(private readonly db: PrismaClient) {}

  async create(input: CreateAuditLogInput): Promise<AuditLog> {
    const record = await this.db.auditLog.create({
      data: {
        storeId: input.storeId,
        userId: input.userId,
        sessionId: input.sessionId,
        entityType: input.entityType,
        entityId: input.entityId,
        action: input.action,
        metadata:
          input.metadata === undefined || input.metadata === null
            ? Prisma.JsonNull
            : (input.metadata as Prisma.InputJsonValue),
      },
    });

    return toAuditLog(record);
  }

  async findById(storeId: string, id: string): Promise<AuditLog | null> {
    const record = await this.db.auditLog.findFirst({
      where: { id, storeId },
    });

    return record ? toAuditLog(record) : null;
  }

  async list(query: ListAuditLogsQuery): Promise<CatalogueListResult<AuditLog>> {
    const where = buildListWhere(query);
    const skip = (query.page - 1) * query.limit;

    const [records, total] = await Promise.all([
      this.db.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: query.limit,
      }),
      this.db.auditLog.count({ where }),
    ]);

    return buildCatalogueListResult({
      items: records.map(toAuditLog),
      total,
      page: query.page,
      limit: query.limit,
    });
  }
}
