import type {
  DisasterReadinessStoreParams,
  GetPlatformBackupVerificationResponse,
  GetPlatformBackupsResponse,
  GetPlatformDisasterReadinessResponse,
  GetPlatformRecoveryResponse,
  UpdatePlatformRecoveryResponse,
  UpdateRecoveryObjectivesRequest,
} from "./contracts";
import type { ApiClientConfig } from "../http/request";
import { apiRequest } from "../http/request";

function toStoreQueryString(params: DisasterReadinessStoreParams): string {
  const searchParams = new URLSearchParams();
  searchParams.set("storeId", params.storeId);
  return `?${searchParams.toString()}`;
}

export interface DisasterReadinessClient {
  getBackups(
    params: DisasterReadinessStoreParams,
  ): Promise<GetPlatformBackupsResponse["data"]>;
  getBackupVerification(
    params: DisasterReadinessStoreParams,
  ): Promise<GetPlatformBackupVerificationResponse["data"]>;
  getRecovery(
    params: DisasterReadinessStoreParams,
  ): Promise<GetPlatformRecoveryResponse["data"]>;
  updateRecoveryObjectives(
    input: UpdateRecoveryObjectivesRequest,
  ): Promise<UpdatePlatformRecoveryResponse["data"]>;
  getDisasterReadiness(
    params: DisasterReadinessStoreParams,
  ): Promise<GetPlatformDisasterReadinessResponse["data"]>;
}

export function createDisasterReadinessClient(
  config: ApiClientConfig,
): DisasterReadinessClient {
  return {
    getBackups: (params) =>
      apiRequest<GetPlatformBackupsResponse["data"]>(config, {
        method: "GET",
        path: `/api/platform/backups${toStoreQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      }),

    getBackupVerification: (params) =>
      apiRequest<GetPlatformBackupVerificationResponse["data"]>(config, {
        method: "GET",
        path: `/api/platform/backups/verification${toStoreQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      }),

    getRecovery: (params) =>
      apiRequest<GetPlatformRecoveryResponse["data"]>(config, {
        method: "GET",
        path: `/api/platform/recovery${toStoreQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      }),

    updateRecoveryObjectives: (input) =>
      apiRequest<UpdatePlatformRecoveryResponse["data"]>(config, {
        method: "PATCH",
        path: "/api/platform/recovery",
        body: input,
        accessToken: config.getAccessToken?.(),
      }),

    getDisasterReadiness: (params) =>
      apiRequest<GetPlatformDisasterReadinessResponse["data"]>(config, {
        method: "GET",
        path: `/api/platform/disaster-readiness${toStoreQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      }),
  };
}
