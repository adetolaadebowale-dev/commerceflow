import { buildCatalogueListResult, type ExportJob } from "@commerceflow/types";
import type { CreateExportJobInput, ListExportJobsQuery } from "@commerceflow/validation";

import type { ExportRepository } from "./export.repository";

export class MemoryExportRepository implements ExportRepository {
  private readonly jobsById = new Map<string, ExportJob>();
  private transactionFailure: Error | null = null;

  setTransactionFailure(error: Error | null): void {
    this.transactionFailure = error;
  }

  async findById(storeId: string, id: string): Promise<ExportJob | null> {
    const job = this.jobsById.get(id);
    return job?.storeId === storeId ? job : null;
  }

  async list(query: ListExportJobsQuery) {
    let items = [...this.jobsById.values()].filter(
      (job) => job.storeId === query.storeId,
    );

    if (query.status) {
      items = items.filter((job) => job.status === query.status);
    }

    if (query.type) {
      items = items.filter((job) => job.type === query.type);
    }

    items.sort(
      (left, right) =>
        right.createdAt.localeCompare(left.createdAt) ||
        left.id.localeCompare(right.id),
    );

    const total = items.length;
    const start = (query.page - 1) * query.limit;

    return buildCatalogueListResult({
      items: items.slice(start, start + query.limit),
      total,
      page: query.page,
      limit: query.limit,
    });
  }

  async create(input: CreateExportJobInput): Promise<ExportJob> {
    if (this.transactionFailure) {
      throw this.transactionFailure;
    }

    const now = new Date().toISOString();
    const job: ExportJob = {
      id: crypto.randomUUID(),
      storeId: input.storeId,
      type: input.type,
      status: "pending",
      format: input.format,
      metadata: input.metadata,
      createdAt: now,
      updatedAt: now,
    };

    this.jobsById.set(job.id, job);
    return job;
  }

  async markProcessing(storeId: string, id: string): Promise<ExportJob> {
    if (this.transactionFailure) {
      throw this.transactionFailure;
    }

    const existing = await this.findById(storeId, id);

    if (!existing || existing.status !== "pending") {
      throw new Error(`Export job not found or not pending: ${id}`);
    }

    const updated: ExportJob = {
      ...existing,
      status: "processing",
      updatedAt: new Date().toISOString(),
    };

    this.jobsById.set(id, updated);
    return updated;
  }

  async markCompleted(
    storeId: string,
    id: string,
    completedAt: string,
    metadata: Record<string, unknown>,
  ): Promise<ExportJob> {
    if (this.transactionFailure) {
      throw this.transactionFailure;
    }

    const existing = await this.findById(storeId, id);

    if (!existing || existing.status !== "processing") {
      throw new Error(`Export job not found or not processing: ${id}`);
    }

    const updated: ExportJob = {
      ...existing,
      status: "completed",
      metadata: { ...existing.metadata, ...metadata },
      completedAt,
      updatedAt: new Date().toISOString(),
    };

    this.jobsById.set(id, updated);
    return updated;
  }

  async markFailed(
    storeId: string,
    id: string,
    completedAt: string,
    failureReason: string,
  ): Promise<ExportJob> {
    if (this.transactionFailure) {
      throw this.transactionFailure;
    }

    const existing = await this.findById(storeId, id);

    if (!existing || existing.status !== "processing") {
      throw new Error(`Export job not found or not processing: ${id}`);
    }

    const updated: ExportJob = {
      ...existing,
      status: "failed",
      completedAt,
      failureReason,
      updatedAt: new Date().toISOString(),
    };

    this.jobsById.set(id, updated);
    return updated;
  }
}
