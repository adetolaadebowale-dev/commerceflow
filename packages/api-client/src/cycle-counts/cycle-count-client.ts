import type {
  CycleCount,
  CycleCountApprovalResult,
} from "@commerceflow/types";
import type {
  ApproveCycleCountInput,
  CreateCycleCountInput,
  CycleCountIdQuery,
  ListCycleCountsQuery,
  UpdateCycleCountInput,
} from "@commerceflow/validation";

import type { ApiSuccessResponse } from "../common/api-response";
import type { ApiClientConfig } from "../http/request";
import { apiRequest } from "../http/request";

function toQueryString(
  params: ListCycleCountsQuery | CycleCountIdQuery,
): string {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      searchParams.set(key, String(value));
    }
  }

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export type CreateCycleCountRequest = CreateCycleCountInput;
export type CreateCycleCountResponse = ApiSuccessResponse<{ cycleCount: CycleCount }>;
export type GetCycleCountParams = CycleCountIdQuery;
export type GetCycleCountResponse = ApiSuccessResponse<{ cycleCount: CycleCount }>;
export type ListCycleCountsParams = ListCycleCountsQuery;
export type ListCycleCountsResponse = ApiSuccessResponse<{
  cycleCounts: import("@commerceflow/types").CatalogueListResult<CycleCount>;
}>;
export type StartCycleCountRequest = ApproveCycleCountInput;
export type StartCycleCountResponse = ApiSuccessResponse<{ cycleCount: CycleCount }>;
export type CompleteCycleCountRequest = UpdateCycleCountInput;
export type CompleteCycleCountResponse = ApiSuccessResponse<{ cycleCount: CycleCount }>;
export type ApproveCycleCountRequest = ApproveCycleCountInput;
export type ApproveCycleCountResponse = ApiSuccessResponse<{
  result: CycleCountApprovalResult;
}>;

export interface CycleCountClient {
  createCycleCount(
    input: CreateCycleCountRequest,
  ): Promise<CreateCycleCountResponse["data"]>;
  startCycleCount(
    id: string,
    input: StartCycleCountRequest,
  ): Promise<StartCycleCountResponse["data"]>;
  completeCycleCount(
    id: string,
    input: CompleteCycleCountRequest,
  ): Promise<CompleteCycleCountResponse["data"]>;
  approveCycleCount(
    id: string,
    input: ApproveCycleCountRequest,
  ): Promise<ApproveCycleCountResponse["data"]>;
  getCycleCount(
    id: string,
    params: GetCycleCountParams,
  ): Promise<GetCycleCountResponse["data"]>;
  listCycleCounts(
    params: ListCycleCountsParams,
  ): Promise<ListCycleCountsResponse["data"]>;
}

export function createCycleCountClient(config: ApiClientConfig): CycleCountClient {
  return {
    createCycleCount: (input) =>
      apiRequest<CreateCycleCountResponse["data"]>(config, {
        method: "POST",
        path: "/api/cycle-counts",
        body: input,
        accessToken: config.getAccessToken?.(),
      }),

    startCycleCount: (id, input) =>
      apiRequest<StartCycleCountResponse["data"]>(config, {
        method: "POST",
        path: `/api/cycle-counts/${id}/start`,
        body: input,
        accessToken: config.getAccessToken?.(),
      }),

    completeCycleCount: (id, input) =>
      apiRequest<CompleteCycleCountResponse["data"]>(config, {
        method: "POST",
        path: `/api/cycle-counts/${id}/complete`,
        body: input,
        accessToken: config.getAccessToken?.(),
      }),

    approveCycleCount: (id, input) =>
      apiRequest<ApproveCycleCountResponse["data"]>(config, {
        method: "POST",
        path: `/api/cycle-counts/${id}/approve`,
        body: input,
        accessToken: config.getAccessToken?.(),
      }),

    getCycleCount: (id, params) =>
      apiRequest<GetCycleCountResponse["data"]>(config, {
        method: "GET",
        path: `/api/cycle-counts/${id}${toQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      }),

    listCycleCounts: (params) =>
      apiRequest<ListCycleCountsResponse["data"]>(config, {
        method: "GET",
        path: `/api/cycle-counts${toQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      }),
  };
}
