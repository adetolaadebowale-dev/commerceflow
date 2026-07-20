import {
  createFulfillmentClient,
  createInventoryAdjustmentClient,
  createInventoryClient,
  createReportsClient,
} from "@commerceflow/api-client";

import { API_BASE_URL } from "@/services/api-client";
import { toAdminApiError } from "@/services/catalogue-client";
import { refreshStoredAccessToken } from "@/services/token-refresh";
import { getStoredAccessToken } from "@/services/token-storage";

const clientConfig = {
  baseUrl: API_BASE_URL,
  getAccessToken: getStoredAccessToken,
  refreshAccessToken: refreshStoredAccessToken,
};

export const inventoryClient = createInventoryClient(clientConfig);
export const inventoryAdjustmentClient =
  createInventoryAdjustmentClient(clientConfig);
export const fulfillmentClient = createFulfillmentClient(clientConfig);
export const reportsClient = createReportsClient(clientConfig);

export { toAdminApiError };
