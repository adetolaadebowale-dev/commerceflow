import type { Job } from "@commerceflow/types";
import type { CreateJobInput, ListJobsQuery } from "@commerceflow/validation";

export interface JobRepository {
  findById(storeId: string, id: string): Promise<Job | null>;
  list(query: ListJobsQuery): Promise<{
    items: readonly Job[];
    total: number;
    page: number;
    limit: number;
  }>;
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
