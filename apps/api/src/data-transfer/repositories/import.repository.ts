import type { ImportJob } from "@commerceflow/types";
import type { CreateImportJobInput, ListImportJobsQuery } from "@commerceflow/validation";

export interface ImportRepository {
  findById(storeId: string, id: string): Promise<ImportJob | null>;
  list(query: ListImportJobsQuery): Promise<{
    items: readonly ImportJob[];
    total: number;
    page: number;
    limit: number;
  }>;
  create(input: CreateImportJobInput): Promise<ImportJob>;
  markProcessing(storeId: string, id: string): Promise<ImportJob>;
  markCompleted(
    storeId: string,
    id: string,
    completedAt: string,
    metadata: Record<string, unknown>,
  ): Promise<ImportJob>;
  markFailed(
    storeId: string,
    id: string,
    completedAt: string,
    failureReason: string,
  ): Promise<ImportJob>;
}
