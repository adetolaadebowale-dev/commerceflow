import type {
  CreateJobRequest,
  CreateJobResponse,
  GetJobResponse,
  JobStoreScopedParams,
  ListJobsParams,
  ListJobsResponse,
  RunJobResponse,
} from "./contracts";
import type { ApiClientConfig } from "../http/request";
import { apiRequest } from "../http/request";

function toQueryString(params: JobStoreScopedParams): string {
  const searchParams = new URLSearchParams();
  searchParams.set("storeId", params.storeId);
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

function toListQueryString(params: ListJobsParams): string {
  const searchParams = new URLSearchParams();
  searchParams.set("storeId", params.storeId);
  searchParams.set("page", String(params.page));
  searchParams.set("limit", String(params.limit));

  if (params.status) {
    searchParams.set("status", params.status);
  }

  if (params.type) {
    searchParams.set("type", params.type);
  }

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export interface JobsClient {
  createJob(input: CreateJobRequest): Promise<CreateJobResponse["data"]>;
  listJobs(params: ListJobsParams): Promise<ListJobsResponse["data"]>;
  getJob(
    id: string,
    params: JobStoreScopedParams,
  ): Promise<GetJobResponse["data"]>;
  runJob(
    id: string,
    params: JobStoreScopedParams,
  ): Promise<RunJobResponse["data"]>;
}

export function createJobsClient(config: ApiClientConfig): JobsClient {
  return {
    createJob: (input) =>
      apiRequest<CreateJobResponse["data"]>(config, {
        method: "POST",
        path: "/api/jobs",
        body: input,
        accessToken: config.getAccessToken?.(),
      }),

    listJobs: (params) =>
      apiRequest<ListJobsResponse["data"]>(config, {
        method: "GET",
        path: `/api/jobs${toListQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      }),

    getJob: (id, params) =>
      apiRequest<GetJobResponse["data"]>(config, {
        method: "GET",
        path: `/api/jobs/${id}${toQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      }),

    runJob: (id, params) =>
      apiRequest<RunJobResponse["data"]>(config, {
        method: "POST",
        path: `/api/jobs/${id}/run${toQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      }),
  };
}
