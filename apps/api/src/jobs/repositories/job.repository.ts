import type { Job, JobStatus } from "@commerceflow/types";
import type { CreateJobInput, ListJobsQuery } from "@commerceflow/validation";

export interface JobStatusSummary {
  readonly total: number;
  readonly byStatus: Record<JobStatus, number>;
  readonly oldestPendingScheduledFor?: string;
}

export interface JobRepository {
  findById(storeId: string, id: string): Promise<Job | null>;
  list(query: ListJobsQuery): Promise<{
    items: readonly Job[];
    total: number;
    page: number;
    limit: number;
  }>;
  summarizeForStore(storeId: string): Promise<JobStatusSummary>;
  create(input: CreateJobInput, scheduledFor: string): Promise<Job>;
  markRunning(
    storeId: string,
    id: string,
    startedAt: string,
  ): Promise<Job>;
  markCompleted(
    storeId: string,
    id: string,
    completedAt: string,
  ): Promise<Job>;
  markFailed(
    storeId: string,
    id: string,
    completedAt: string,
    failureReason: string,
  ): Promise<Job>;
}
