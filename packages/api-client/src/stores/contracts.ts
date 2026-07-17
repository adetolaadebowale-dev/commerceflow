import type { StoreConfiguration } from "@commerceflow/types";
import type { UpdateStoreSettingsInput } from "@commerceflow/validation";

import type { ApiSuccessResponse } from "../common/api-response";

export type GetStoreSettingsResponse = ApiSuccessResponse<{
  store: StoreConfiguration;
}>;

export type UpdateStoreSettingsRequest = UpdateStoreSettingsInput;
export type UpdateStoreSettingsResponse = ApiSuccessResponse<{
  store: StoreConfiguration;
}>;
