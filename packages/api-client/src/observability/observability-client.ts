import type {
  GetPlatformLoggingDiagnosticsResponse,
  GetPlatformLoggingResponse,
  ObservabilityStoreParams,
} from "./contracts";
import type { ApiClientConfig } from "../http/request";
import { apiRequest } from "../http/request";

function toStoreQueryString(params: ObservabilityStoreParams): string {
  const searchParams = new URLSearchParams();
  searchParams.set("storeId", params.storeId);
  return `?${searchParams.toString()}`;
}

export interface ObservabilityClient {
  getLogging(
    params: ObservabilityStoreParams,
  ): Promise<GetPlatformLoggingResponse["data"]>;
  getDiagnostics(
    params: ObservabilityStoreParams,
  ): Promise<GetPlatformLoggingDiagnosticsResponse["data"]>;
}

export function createObservabilityClient(
  config: ApiClientConfig,
): ObservabilityClient {
  return {
    getLogging: (params) =>
      apiRequest<GetPlatformLoggingResponse["data"]>(config, {
        method: "GET",
        path: `/api/platform/logging${toStoreQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      }),

    getDiagnostics: (params) =>
      apiRequest<GetPlatformLoggingDiagnosticsResponse["data"]>(config, {
        method: "GET",
        path: `/api/platform/logging/diagnostics${toStoreQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      }),
  };
}
