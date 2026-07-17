import type {
  GetPlatformDiagnosticsResponse,
  GetPlatformHealthResponse,
  GetPlatformJobsSummaryResponse,
  GetPlatformLivenessResponse,
  GetPlatformReadinessResponse,
  GetPlatformVersionResponse,
  PlatformStoreParams,
  UpdateMaintenanceModeRequest,
  UpdatePlatformMaintenanceResponse,
} from "./contracts";
import type { ApiClientConfig } from "../http/request";
import { apiRequest } from "../http/request";

function toStoreQueryString(params: PlatformStoreParams): string {
  const searchParams = new URLSearchParams();
  searchParams.set("storeId", params.storeId);
  return `?${searchParams.toString()}`;
}

export interface PlatformOperationsClient {
  getHealth(
    params: PlatformStoreParams,
  ): Promise<GetPlatformHealthResponse["data"]>;
  getReadiness(): Promise<GetPlatformReadinessResponse["data"]>;
  getLiveness(): Promise<GetPlatformLivenessResponse["data"]>;
  getVersion(
    params: PlatformStoreParams,
  ): Promise<GetPlatformVersionResponse["data"]>;
  getDiagnostics(
    params: PlatformStoreParams,
  ): Promise<GetPlatformDiagnosticsResponse["data"]>;
  getJobsSummary(
    params: PlatformStoreParams,
  ): Promise<GetPlatformJobsSummaryResponse["data"]>;
  updateMaintenance(
    input: UpdateMaintenanceModeRequest,
  ): Promise<UpdatePlatformMaintenanceResponse["data"]>;
}

export function createPlatformOperationsClient(
  config: ApiClientConfig,
): PlatformOperationsClient {
  return {
    getHealth: (params) =>
      apiRequest<GetPlatformHealthResponse["data"]>(config, {
        method: "GET",
        path: `/api/platform/health${toStoreQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      }),

    getReadiness: () =>
      apiRequest<GetPlatformReadinessResponse["data"]>(config, {
        method: "GET",
        path: "/api/platform/ready",
        accessToken: config.getAccessToken?.(),
      }),

    getLiveness: () =>
      apiRequest<GetPlatformLivenessResponse["data"]>(config, {
        method: "GET",
        path: "/api/platform/live",
        accessToken: config.getAccessToken?.(),
      }),

    getVersion: (params) =>
      apiRequest<GetPlatformVersionResponse["data"]>(config, {
        method: "GET",
        path: `/api/platform/version${toStoreQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      }),

    getDiagnostics: (params) =>
      apiRequest<GetPlatformDiagnosticsResponse["data"]>(config, {
        method: "GET",
        path: `/api/platform/diagnostics${toStoreQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      }),

    getJobsSummary: (params) =>
      apiRequest<GetPlatformJobsSummaryResponse["data"]>(config, {
        method: "GET",
        path: `/api/platform/jobs/summary${toStoreQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      }),

    updateMaintenance: (input) =>
      apiRequest<UpdatePlatformMaintenanceResponse["data"]>(config, {
        method: "PATCH",
        path: "/api/platform/maintenance",
        body: input,
        accessToken: config.getAccessToken?.(),
      }),
  };
}
