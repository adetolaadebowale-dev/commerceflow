import { buildCatalogueListResult, type Job } from "@commerceflow/types";
import type { CreateJobInput, ListJobsQuery } from "@commerceflow/validation";

import type { JobRepository } from "./job.repository";

export class MemoryJobRepository implements JobRepository {
  private readonly jobsById = new Map<string, Job>();
  private transactionFailure: Error | null = null;

  setTransactionFailure(error: Error | null): void {
    this.transactionFailure = error;
  }

  getJobCount(): number {
    return this.jobsById.size;
  }

  async findById(storeId: string, id: string): Promise<Job | null> {
    const job = this.jobsById.get(id);
    return job?.storeId === storeId ? job : null;
  }

  async list(query: ListJobsQuery) {
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
    const paged = items.slice(start, start + query.limit);

    return buildCatalogueListResult({
      items: paged,
      total,
      page: query.page,
      limit: query.limit,
    });
  }

  async create(input: CreateJobInput, scheduledFor: string): Promise<Job> {
    if (this.transactionFailure) {
      throw this.transactionFailure;
    }

    const now = new Date().toISOString();
    const job: Job = {
      id: crypto.randomUUID(),
      storeId: input.storeId,
      type: input.type,
      status: "pending",
      payload: input.payload,
      scheduledFor,
      createdAt: now,
      updatedAt: now,
    };

    this.jobsById.set(job.id, job);
    return job;
  }

  async markRunning(
    storeId: string,
    id: string,
    startedAt: string,
  ): Promise<Job> {
    if (this.transactionFailure) {
      throw this.transactionFailure;
    }

    const existing = await this.findById(storeId, id);

    if (!existing || existing.status !== "pending") {
      throw new Error(`Job not found or not pending: ${id}`);
    }

    const updated: Job = {
      ...existing,
      status: "running",
      startedAt,
      updatedAt: new Date().toISOString(),
    };

    this.jobsById.set(id, updated);
    return updated;
  }

  async markCompleted(
    storeId: string,
    id: string,
    completedAt: string,
  ): Promise<Job> {
    if (this.transactionFailure) {
      throw this.transactionFailure;
    }

    const existing = await this.findById(storeId, id);

    if (!existing || existing.status !== "running") {
      throw new Error(`Job not found or not running: ${id}`);
    }

    const updated: Job = {
      ...existing,
      status: "completed",
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
  ): Promise<Job> {
    if (this.transactionFailure) {
      throw this.transactionFailure;
    }

    const existing = await this.findById(storeId, id);

    if (!existing || existing.status !== "running") {
      throw new Error(`Job not found or not running: ${id}`);
    }

    const updated: Job = {
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
