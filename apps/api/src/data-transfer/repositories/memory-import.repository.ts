import { buildCatalogueListResult, type ImportJob } from "@commerceflow/types";
import type { CreateImportJobInput, ListImportJobsQuery } from "@commerceflow/validation";

import type { ImportRepository } from "./import.repository";

export class MemoryImportRepository implements ImportRepository {
  private readonly jobsById = new Map<string, ImportJob>();
  private transactionFailure: Error | null = null;

  setTransactionFailure(error: Error | null): void {
    this.transactionFailure = error;
  }

  async findById(storeId: string, id: string): Promise<ImportJob | null> {
    const job = this.jobsById.get(id);
    return job?.storeId === storeId ? job : null;
  }

  async list(query: ListImportJobsQuery) {
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

  async create(input: CreateImportJobInput): Promise<ImportJob> {
    if (this.transactionFailure) {
      throw this.transactionFailure;
    }

    const now = new Date().toISOString();
    const job: ImportJob = {
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

  async markProcessing(storeId: string, id: string): Promise<ImportJob> {
    if (this.transactionFailure) {
      throw this.transactionFailure;
    }

    const existing = await this.findById(storeId, id);

    if (!existing || existing.status !== "pending") {
      throw new Error(`Import job not found or not pending: ${id}`);
    }

    const updated: ImportJob = {
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
  ): Promise<ImportJob> {
    if (this.transactionFailure) {
      throw this.transactionFailure;
    }

    const existing = await this.findById(storeId, id);

    if (!existing || existing.status !== "processing") {
      throw new Error(`Import job not found or not processing: ${id}`);
    }

    const updated: ImportJob = {
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
  ): Promise<ImportJob> {
    if (this.transactionFailure) {
      throw this.transactionFailure;
    }

    const existing = await this.findById(storeId, id);

    if (!existing || existing.status !== "processing") {
      throw new Error(`Import job not found or not processing: ${id}`);
    }

    const updated: ImportJob = {
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
