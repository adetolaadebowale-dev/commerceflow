import {
  createCustomerClient,
  createOrderClient,
  createReservationClient,
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

export const orderClient = createOrderClient(clientConfig);
export const customerClient = createCustomerClient(clientConfig);
export const reservationClient = createReservationClient(clientConfig);

export { toAdminApiError };
