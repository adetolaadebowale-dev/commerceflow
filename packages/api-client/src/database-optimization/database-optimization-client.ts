import type {
  DatabaseOptimizationStoreParams,
  GetPlatformDatabaseDiagnosticsResponse,
  GetPlatformDatabaseIndexesResponse,
  GetPlatformDatabaseResponse,
} from "./contracts";
import type { ApiClientConfig } from "../http/request";
import { apiRequest } from "../http/request";

function toStoreQueryString(params: DatabaseOptimizationStoreParams): string {
  const searchParams = new URLSearchParams();
  searchParams.set("storeId", params.storeId);
  return `?${searchParams.toString()}`;
}

export interface DatabaseOptimizationClient {
  getDatabase(
    params: DatabaseOptimizationStoreParams,
  ): Promise<GetPlatformDatabaseResponse["data"]>;
  getIndexes(
    params: DatabaseOptimizationStoreParams,
  ): Promise<GetPlatformDatabaseIndexesResponse["data"]>;
  getDiagnostics(
    params: DatabaseOptimizationStoreParams,
  ): Promise<GetPlatformDatabaseDiagnosticsResponse["data"]>;
}

export function createDatabaseOptimizationClient(
  config: ApiClientConfig,
): DatabaseOptimizationClient {
  return {
    getDatabase: (params) =>
      apiRequest<GetPlatformDatabaseResponse["data"]>(config, {
        method: "GET",
        path: `/api/platform/database${toStoreQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      }),

    getIndexes: (params) =>
      apiRequest<GetPlatformDatabaseIndexesResponse["data"]>(config, {
        method: "GET",
        path: `/api/platform/database/indexes${toStoreQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      }),

    getDiagnostics: (params) =>
      apiRequest<GetPlatformDatabaseDiagnosticsResponse["data"]>(config, {
        method: "GET",
        path: `/api/platform/database/diagnostics${toStoreQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      }),
  };
}
