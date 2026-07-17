import type {
  GetStoreSettingsResponse,
  UpdateStoreSettingsRequest,
  UpdateStoreSettingsResponse,
} from "./contracts";
import type { ApiClientConfig } from "../http/request";
import { apiRequest } from "../http/request";

export interface StoreAdministrationClient {
  getStoreSettings(
    storeId: string,
  ): Promise<GetStoreSettingsResponse["data"]>;
  updateStoreSettings(
    storeId: string,
    input: UpdateStoreSettingsRequest,
  ): Promise<UpdateStoreSettingsResponse["data"]>;
}

export function createStoreAdministrationClient(
  config: ApiClientConfig,
): StoreAdministrationClient {
  return {
    getStoreSettings: (storeId) =>
      apiRequest<GetStoreSettingsResponse["data"]>(config, {
        method: "GET",
        path: `/api/stores/${storeId}/settings`,
        accessToken: config.getAccessToken?.(),
      }),

    updateStoreSettings: (storeId, input) =>
      apiRequest<UpdateStoreSettingsResponse["data"]>(config, {
        method: "PATCH",
        path: `/api/stores/${storeId}/settings`,
        body: input,
        accessToken: config.getAccessToken?.(),
      }),
  };
}
