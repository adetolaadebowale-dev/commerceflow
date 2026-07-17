import type {
  DeploymentReadinessStoreParams,
  GetPlatformDeploymentChecklistResponse,
  GetPlatformDeploymentResponse,
  GetPlatformEnvironmentResponse,
  GetPlatformReleaseResponse,
  UpdateDeploymentConfigurationRequest,
  UpdatePlatformDeploymentResponse,
} from "./contracts";
import type { ApiClientConfig } from "../http/request";
import { apiRequest } from "../http/request";

function toStoreQueryString(params: DeploymentReadinessStoreParams): string {
  const searchParams = new URLSearchParams();
  searchParams.set("storeId", params.storeId);
  return `?${searchParams.toString()}`;
}

export interface DeploymentReadinessClient {
  getDeployment(
    params: DeploymentReadinessStoreParams,
  ): Promise<GetPlatformDeploymentResponse["data"]>;
  updateConfiguration(
    input: UpdateDeploymentConfigurationRequest,
  ): Promise<UpdatePlatformDeploymentResponse["data"]>;
  getChecklist(
    params: DeploymentReadinessStoreParams,
  ): Promise<GetPlatformDeploymentChecklistResponse["data"]>;
  getEnvironment(
    params: DeploymentReadinessStoreParams,
  ): Promise<GetPlatformEnvironmentResponse["data"]>;
  getRelease(
    params: DeploymentReadinessStoreParams,
  ): Promise<GetPlatformReleaseResponse["data"]>;
}

export function createDeploymentReadinessClient(
  config: ApiClientConfig,
): DeploymentReadinessClient {
  return {
    getDeployment: (params) =>
      apiRequest<GetPlatformDeploymentResponse["data"]>(config, {
        method: "GET",
        path: `/api/platform/deployment${toStoreQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      }),

    updateConfiguration: (input) =>
      apiRequest<UpdatePlatformDeploymentResponse["data"]>(config, {
        method: "PATCH",
        path: "/api/platform/deployment",
        body: input,
        accessToken: config.getAccessToken?.(),
      }),

    getChecklist: (params) =>
      apiRequest<GetPlatformDeploymentChecklistResponse["data"]>(config, {
        method: "GET",
        path: `/api/platform/deployment/checklist${toStoreQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      }),

    getEnvironment: (params) =>
      apiRequest<GetPlatformEnvironmentResponse["data"]>(config, {
        method: "GET",
        path: `/api/platform/environment${toStoreQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      }),

    getRelease: (params) =>
      apiRequest<GetPlatformReleaseResponse["data"]>(config, {
        method: "GET",
        path: `/api/platform/release${toStoreQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      }),
  };
}
