import {
  Prisma,
  type PrismaClient,
  type ExportJob as PrismaExportJob,
} from "@prisma/client";
import { buildCatalogueListResult, type ExportJob } from "@commerceflow/types";
import type { CreateExportJobInput, ListExportJobsQuery } from "@commerceflow/validation";

import type { ExportRepository } from "./export.repository";

function toMetadata(value: Prisma.JsonValue): Record<string, unknown> {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return {};
}

function toExportJob(record: PrismaExportJob): ExportJob {
  return {
    id: record.id,
    storeId: record.storeId,
    type: record.type,
    status: record.status,
    format: record.format,
    metadata: toMetadata(record.metadata),
    completedAt: record.completedAt?.toISOString(),
    failureReason: record.failureReason ?? undefined,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function buildListWhere(query: ListExportJobsQuery): Prisma.ExportJobWhereInput {
  return {
    storeId: query.storeId,
    ...(query.status ? { status: query.status } : {}),
    ...(query.type ? { type: query.type } : {}),
  };
}

export class PrismaExportRepository implements ExportRepository {
  constructor(private readonly db: PrismaClient) {}

  async findById(storeId: string, id: string): Promise<ExportJob | null> {
    const record = await this.db.exportJob.findFirst({
      where: { id, storeId },
    });

    return record ? toExportJob(record) : null;
  }

  async list(query: ListExportJobsQuery) {
    const where = buildListWhere(query);
    const skip = (query.page - 1) * query.limit;

    const [records, total] = await Promise.all([
      this.db.exportJob.findMany({
        where,
        orderBy: [{ createdAt: "desc" }, { id: "asc" }],
        skip,
        take: query.limit,
      }),
      this.db.exportJob.count({ where }),
    ]);

    return buildCatalogueListResult({
      items: records.map(toExportJob),
      total,
      page: query.page,
      limit: query.limit,
    });
  }

  async create(input: CreateExportJobInput): Promise<ExportJob> {
    const record = await this.db.exportJob.create({
      data: {
        storeId: input.storeId,
        type: input.type,
        status: "pending",
        format: input.format,
        metadata: input.metadata as unknown as Prisma.InputJsonValue,
      },
    });

    return toExportJob(record);
  }

  async markProcessing(storeId: string, id: string): Promise<ExportJob> {
    const result = await this.db.exportJob.updateMany({
      where: { id, storeId, status: "pending" },
      data: { status: "processing" },
    });

    if (result.count === 0) {
      throw new Error(`Export job not found or not pending: ${id}`);
    }

    const record = await this.db.exportJob.findFirstOrThrow({
      where: { id, storeId },
    });

    return toExportJob(record);
  }

  async markCompleted(
    storeId: string,
    id: string,
    completedAt: string,
    metadata: Record<string, unknown>,
  ): Promise<ExportJob> {
    const existing = await this.findById(storeId, id);

    if (!existing) {
      throw new Error(`Export job not found: ${id}`);
    }

    const result = await this.db.exportJob.updateMany({
      where: { id, storeId, status: "processing" },
      data: {
        status: "completed",
        completedAt: new Date(completedAt),
        metadata: {
          ...existing.metadata,
          ...metadata,
        } as unknown as Prisma.InputJsonValue,
      },
    });

    if (result.count === 0) {
      throw new Error(`Export job not found or not processing: ${id}`);
    }

    const record = await this.db.exportJob.findFirstOrThrow({
      where: { id, storeId },
    });

    return toExportJob(record);
  }

  async markFailed(
    storeId: string,
    id: string,
    completedAt: string,
    failureReason: string,
  ): Promise<ExportJob> {
    const result = await this.db.exportJob.updateMany({
      where: { id, storeId, status: "processing" },
      data: {
        status: "failed",
        completedAt: new Date(completedAt),
        failureReason,
      },
    });

    if (result.count === 0) {
      throw new Error(`Export job not found or not processing: ${id}`);
    }

    const record = await this.db.exportJob.findFirstOrThrow({
      where: { id, storeId },
    });

    return toExportJob(record);
  }
}
