import {
  Prisma,
  type PrismaClient,
  type Job as PrismaJob,
} from "@prisma/client";
import { buildCatalogueListResult, type Job } from "@commerceflow/types";
import type { CreateJobInput, ListJobsQuery } from "@commerceflow/validation";

import type { JobRepository } from "./job.repository";

function toPayload(value: Prisma.JsonValue): Record<string, unknown> {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return {};
}

function toJob(record: PrismaJob): Job {
  return {
    id: record.id,
    storeId: record.storeId,
    type: record.type,
    status: record.status,
    payload: toPayload(record.payload),
    scheduledFor: record.scheduledFor.toISOString(),
    startedAt: record.startedAt?.toISOString(),
    completedAt: record.completedAt?.toISOString(),
    failureReason: record.failureReason ?? undefined,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function buildListWhere(query: ListJobsQuery): Prisma.JobWhereInput {
  return {
    storeId: query.storeId,
    ...(query.status ? { status: query.status } : {}),
    ...(query.type ? { type: query.type } : {}),
  };
}

export class PrismaJobRepository implements JobRepository {
  constructor(private readonly db: PrismaClient) {}

  async findById(storeId: string, id: string): Promise<Job | null> {
    const record = await this.db.job.findFirst({
      where: { id, storeId },
    });

    return record ? toJob(record) : null;
  }

  async list(query: ListJobsQuery) {
    const where = buildListWhere(query);
    const skip = (query.page - 1) * query.limit;

    const [records, total] = await Promise.all([
      this.db.job.findMany({
        where,
        orderBy: [{ createdAt: "desc" }, { id: "asc" }],
        skip,
        take: query.limit,
      }),
      this.db.job.count({ where }),
    ]);

    return buildCatalogueListResult({
      items: records.map(toJob),
      total,
      page: query.page,
      limit: query.limit,
    });
  }

  async summarizeForStore(storeId: string) {
    const [grouped, oldestPending] = await Promise.all([
      this.db.job.groupBy({
        by: ["status"],
        where: { storeId },
        _count: { _all: true },
      }),
      this.db.job.findFirst({
        where: { storeId, status: "pending" },
        orderBy: { scheduledFor: "asc" },
        select: { scheduledFor: true },
      }),
    ]);

    const byStatus = {
      pending: 0,
      running: 0,
      completed: 0,
      failed: 0,
    };

    for (const row of grouped) {
      byStatus[row.status] = row._count._all;
    }

    return {
      total:
        byStatus.pending +
        byStatus.running +
        byStatus.completed +
        byStatus.failed,
      byStatus,
      oldestPendingScheduledFor: oldestPending?.scheduledFor.toISOString(),
    };
  }

  async create(input: CreateJobInput, scheduledFor: string): Promise<Job> {
    const record = await this.db.job.create({
      data: {
        storeId: input.storeId,
        type: input.type,
        status: "pending",
        payload: input.payload as Prisma.InputJsonValue,
        scheduledFor: new Date(scheduledFor),
      },
    });

    return toJob(record);
  }

  async markRunning(
    storeId: string,
    id: string,
    startedAt: string,
  ): Promise<Job> {
    const result = await this.db.job.updateMany({
      where: { id, storeId, status: "pending" },
      data: {
        status: "running",
        startedAt: new Date(startedAt),
      },
    });

    if (result.count === 0) {
      throw new Error(`Job not found or not pending: ${id}`);
    }

    const record = await this.db.job.findFirstOrThrow({
      where: { id, storeId },
    });

    return toJob(record);
  }

  async markCompleted(
    storeId: string,
    id: string,
    completedAt: string,
  ): Promise<Job> {
    const result = await this.db.job.updateMany({
      where: { id, storeId, status: "running" },
      data: {
        status: "completed",
        completedAt: new Date(completedAt),
      },
    });

    if (result.count === 0) {
      throw new Error(`Job not found or not running: ${id}`);
    }

    const record = await this.db.job.findFirstOrThrow({
      where: { id, storeId },
    });

    return toJob(record);
  }

  async markFailed(
    storeId: string,
    id: string,
    completedAt: string,
    failureReason: string,
  ): Promise<Job> {
    const result = await this.db.job.updateMany({
      where: { id, storeId, status: "running" },
      data: {
        status: "failed",
        completedAt: new Date(completedAt),
        failureReason,
      },
    });

    if (result.count === 0) {
      throw new Error(`Job not found or not running: ${id}`);
    }

    const record = await this.db.job.findFirstOrThrow({
      where: { id, storeId },
    });

    return toJob(record);
  }
}
