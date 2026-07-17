import type { ExportJob } from "@commerceflow/types";
import type { CreateExportJobInput, ListExportJobsQuery } from "@commerceflow/validation";

export interface ExportRepository {
  findById(storeId: string, id: string): Promise<ExportJob | null>;
  list(query: ListExportJobsQuery): Promise<{
    items: readonly ExportJob[];
    total: number;
    page: number;
    limit: number;
  }>;
  create(input: CreateExportJobInput): Promise<ExportJob>;
  markProcessing(storeId: string, id: string): Promise<ExportJob>;
  markCompleted(
    storeId: string,
    id: string,
    completedAt: string,
    metadata: Record<string, unknown>,
  ): Promise<ExportJob>;
  markFailed(
    storeId: string,
    id: string,
    completedAt: string,
    failureReason: string,
  ): Promise<ExportJob>;
}
