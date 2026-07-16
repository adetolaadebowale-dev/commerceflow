import type { CatalogueListResult, Job } from "@commerceflow/types";
import type { CreateJobInput, ListJobsQuery } from "@commerceflow/validation";

import type { ApiSuccessResponse } from "../common/api-response";

/** POST /jobs */
export type CreateJobRequest = CreateJobInput;
export type CreateJobResponse = ApiSuccessResponse<{ job: Job }>;

/** GET /jobs/:id */
export type GetJobResponse = ApiSuccessResponse<{ job: Job }>;

/** GET /jobs */
export type ListJobsParams = ListJobsQuery;
export type ListJobsResponse = ApiSuccessResponse<CatalogueListResult<Job>>;

/** POST /jobs/:id/run */
export type RunJobResponse = ApiSuccessResponse<{ job: Job }>;

export type JobStoreScopedParams = Pick<ListJobsQuery, "storeId">;
