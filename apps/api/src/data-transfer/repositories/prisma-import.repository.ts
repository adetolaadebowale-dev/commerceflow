import {
  Prisma,
  type PrismaClient,
  type ImportJob as PrismaImportJob,
} from "@prisma/client";
import { buildCatalogueListResult, type ImportJob } from "@commerceflow/types";
import type { CreateImportJobInput, ListImportJobsQuery } from "@commerceflow/validation";

import type { ImportRepository } from "./import.repository";

function toMetadata(value: Prisma.JsonValue): Record<string, unknown> {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return {};
}

function toImportJob(record: PrismaImportJob): ImportJob {
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

function buildListWhere(query: ListImportJobsQuery): Prisma.ImportJobWhereInput {
  return {
    storeId: query.storeId,
    ...(query.status ? { status: query.status } : {}),
    ...(query.type ? { type: query.type } : {}),
  };
}

export class PrismaImportRepository implements ImportRepository {
  constructor(private readonly db: PrismaClient) {}

  async findById(storeId: string, id: string): Promise<ImportJob | null> {
    const record = await this.db.importJob.findFirst({
      where: { id, storeId },
    });

    return record ? toImportJob(record) : null;
  }

  async list(query: ListImportJobsQuery) {
    const where = buildListWhere(query);
    const skip = (query.page - 1) * query.limit;

    const [records, total] = await Promise.all([
      this.db.importJob.findMany({
        where,
        orderBy: [{ createdAt: "desc" }, { id: "asc" }],
        skip,
        take: query.limit,
      }),
      this.db.importJob.count({ where }),
    ]);

    return buildCatalogueListResult({
      items: records.map(toImportJob),
      total,
      page: query.page,
      limit: query.limit,
    });
  }

  async create(input: CreateImportJobInput): Promise<ImportJob> {
    const record = await this.db.importJob.create({
      data: {
        storeId: input.storeId,
        type: input.type,
        status: "pending",
        format: input.format,
        metadata: input.metadata as unknown as Prisma.InputJsonValue,
      },
    });

    return toImportJob(record);
  }

  async markProcessing(storeId: string, id: string): Promise<ImportJob> {
    const result = await this.db.importJob.updateMany({
      where: { id, storeId, status: "pending" },
      data: { status: "processing" },
    });

    if (result.count === 0) {
      throw new Error(`Import job not found or not pending: ${id}`);
    }

    const record = await this.db.importJob.findFirstOrThrow({
      where: { id, storeId },
    });

    return toImportJob(record);
  }

  async markCompleted(
    storeId: string,
    id: string,
    completedAt: string,
    metadata: Record<string, unknown>,
  ): Promise<ImportJob> {
    const existing = await this.findById(storeId, id);

    if (!existing) {
      throw new Error(`Import job not found: ${id}`);
    }

    const result = await this.db.importJob.updateMany({
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
      throw new Error(`Import job not found or not processing: ${id}`);
    }

    const record = await this.db.importJob.findFirstOrThrow({
      where: { id, storeId },
    });

    return toImportJob(record);
  }

  async markFailed(
    storeId: string,
    id: string,
    completedAt: string,
    failureReason: string,
  ): Promise<ImportJob> {
    const result = await this.db.importJob.updateMany({
      where: { id, storeId, status: "processing" },
      data: {
        status: "failed",
        completedAt: new Date(completedAt),
        failureReason,
      },
    });

    if (result.count === 0) {
      throw new Error(`Import job not found or not processing: ${id}`);
    }

    const record = await this.db.importJob.findFirstOrThrow({
      where: { id, storeId },
    });

    return toImportJob(record);
  }
}
