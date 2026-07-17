import type {
  GetPlatformLoadTestingBaselinesResponse,
  GetPlatformLoadTestingResponse,
  GetPlatformScalabilityResponse,
  LoadTestingStoreParams,
  UpdateLoadTestingConfigurationRequest,
  UpdatePlatformLoadTestingResponse,
} from "./contracts";
import type { ApiClientConfig } from "../http/request";
import { apiRequest } from "../http/request";

function toStoreQueryString(params: LoadTestingStoreParams): string {
  const searchParams = new URLSearchParams();
  searchParams.set("storeId", params.storeId);
  return `?${searchParams.toString()}`;
}

export interface LoadTestingClient {
  getLoadTesting(
    params: LoadTestingStoreParams,
  ): Promise<GetPlatformLoadTestingResponse["data"]>;
  updateConfiguration(
    input: UpdateLoadTestingConfigurationRequest,
  ): Promise<UpdatePlatformLoadTestingResponse["data"]>;
  getBaselines(
    params: LoadTestingStoreParams,
  ): Promise<GetPlatformLoadTestingBaselinesResponse["data"]>;
  getScalability(
    params: LoadTestingStoreParams,
  ): Promise<GetPlatformScalabilityResponse["data"]>;
}

export function createLoadTestingClient(
  config: ApiClientConfig,
): LoadTestingClient {
  return {
    getLoadTesting: (params) =>
      apiRequest<GetPlatformLoadTestingResponse["data"]>(config, {
        method: "GET",
        path: `/api/platform/load-testing${toStoreQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      }),

    updateConfiguration: (input) =>
      apiRequest<UpdatePlatformLoadTestingResponse["data"]>(config, {
        method: "PATCH",
        path: "/api/platform/load-testing",
        body: input,
        accessToken: config.getAccessToken?.(),
      }),

    getBaselines: (params) =>
      apiRequest<GetPlatformLoadTestingBaselinesResponse["data"]>(config, {
        method: "GET",
        path: `/api/platform/load-testing/baselines${toStoreQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      }),

    getScalability: (params) =>
      apiRequest<GetPlatformScalabilityResponse["data"]>(config, {
        method: "GET",
        path: `/api/platform/scalability${toStoreQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      }),
  };
}
