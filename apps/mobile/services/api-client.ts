import {
  createAuthClient,
  createCatalogueClient,
  createCustomerClient,
  type ApiClientConfig,
} from "@commerceflow/api-client";

import { API_BASE_URL } from "@/lib/env";
import { getStoredAccessToken } from "@/features/auth/auth-storage";
import { refreshStoredAccessToken } from "@/features/auth/token-refresh";

/** Shared API client config — do not duplicate request logic. */
export const mobileApiConfig: ApiClientConfig = {
  baseUrl: API_BASE_URL,
  getAccessToken: getStoredAccessToken,
  refreshAccessToken: refreshStoredAccessToken,
};

export const authApi = createAuthClient(mobileApiConfig);
export const catalogueApi = createCatalogueClient(mobileApiConfig);
export const customerApi = createCustomerClient(mobileApiConfig);
