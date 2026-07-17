import type { ExportJob, ImportJob } from "@commerceflow/types";
import type {
  CreateExportJobInput,
  CreateImportJobInput,
  ListExportJobsQuery,
  ListImportJobsQuery,
} from "@commerceflow/validation";

import type { ApiSuccessResponse } from "../common/api-response";

export type CreateImportJobRequest = CreateImportJobInput;
export type CreateImportJobResponse = ApiSuccessResponse<{
  importJob: ImportJob;
}>;

export type ListImportJobsParams = ListImportJobsQuery;
export type ListImportJobsResponse = ApiSuccessResponse<{
  items: readonly ImportJob[];
  total: number;
  page: number;
  limit: number;
}>;

export type GetImportJobParams = { storeId: string };
export type GetImportJobResponse = ApiSuccessResponse<{
  importJob: ImportJob;
}>;

export type CreateExportJobRequest = CreateExportJobInput;
export type CreateExportJobResponse = ApiSuccessResponse<{
  exportJob: ExportJob;
}>;

export type ListExportJobsParams = ListExportJobsQuery;
export type ListExportJobsResponse = ApiSuccessResponse<{
  items: readonly ExportJob[];
  total: number;
  page: number;
  limit: number;
}>;

export type GetExportJobParams = { storeId: string };
export type GetExportJobResponse = ApiSuccessResponse<{
  exportJob: ExportJob;
}>;
