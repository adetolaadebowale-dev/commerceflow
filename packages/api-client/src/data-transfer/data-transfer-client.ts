import type {
  CreateExportJobRequest,
  CreateExportJobResponse,
  CreateImportJobRequest,
  CreateImportJobResponse,
  GetExportJobParams,
  GetExportJobResponse,
  GetImportJobParams,
  GetImportJobResponse,
  ListExportJobsParams,
  ListExportJobsResponse,
  ListImportJobsParams,
  ListImportJobsResponse,
} from "./contracts";
import type { ApiClientConfig } from "../http/request";
import { apiRequest } from "../http/request";

function toStoreScopedQueryString(params: { storeId: string }): string {
  const searchParams = new URLSearchParams();
  searchParams.set("storeId", params.storeId);
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

function toListImportQueryString(params: ListImportJobsParams): string {
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

function toListExportQueryString(params: ListExportJobsParams): string {
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

export interface DataTransferClient {
  createImportJob(
    input: CreateImportJobRequest,
  ): Promise<CreateImportJobResponse["data"]>;
  listImportJobs(
    params: ListImportJobsParams,
  ): Promise<ListImportJobsResponse["data"]>;
  getImportJob(
    id: string,
    params: GetImportJobParams,
  ): Promise<GetImportJobResponse["data"]>;
  createExportJob(
    input: CreateExportJobRequest,
  ): Promise<CreateExportJobResponse["data"]>;
  listExportJobs(
    params: ListExportJobsParams,
  ): Promise<ListExportJobsResponse["data"]>;
  getExportJob(
    id: string,
    params: GetExportJobParams,
  ): Promise<GetExportJobResponse["data"]>;
}

export function createDataTransferClient(
  config: ApiClientConfig,
): DataTransferClient {
  return {
    createImportJob: (input) =>
      apiRequest<CreateImportJobResponse["data"]>(config, {
        method: "POST",
        path: "/api/imports",
        body: input,
        accessToken: config.getAccessToken?.(),
      }),

    listImportJobs: (params) =>
      apiRequest<ListImportJobsResponse["data"]>(config, {
        method: "GET",
        path: `/api/imports${toListImportQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      }),

    getImportJob: (id, params) =>
      apiRequest<GetImportJobResponse["data"]>(config, {
        method: "GET",
        path: `/api/imports/${id}${toStoreScopedQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      }),

    createExportJob: (input) =>
      apiRequest<CreateExportJobResponse["data"]>(config, {
        method: "POST",
        path: "/api/exports",
        body: input,
        accessToken: config.getAccessToken?.(),
      }),

    listExportJobs: (params) =>
      apiRequest<ListExportJobsResponse["data"]>(config, {
        method: "GET",
        path: `/api/exports${toListExportQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      }),

    getExportJob: (id, params) =>
      apiRequest<GetExportJobResponse["data"]>(config, {
        method: "GET",
        path: `/api/exports/${id}${toStoreScopedQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      }),
  };
}
