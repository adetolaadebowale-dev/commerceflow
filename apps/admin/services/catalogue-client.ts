import {
  ApiClientError,
  createCatalogueClient,
} from "@commerceflow/api-client";

import { API_BASE_URL } from "@/services/api-client";
import { getStoredAccessToken } from "@/services/token-storage";
import { AdminApiError } from "@/types/api";

export const catalogueClient = createCatalogueClient({
  baseUrl: API_BASE_URL,
  getAccessToken: getStoredAccessToken,
});

export function toAdminApiError(error: unknown): AdminApiError {
  if (error instanceof AdminApiError) {
    return error;
  }

  if (error instanceof ApiClientError) {
    return new AdminApiError(
      error.code,
      error.message,
      error.status,
      error.details,
    );
  }

  return new AdminApiError(
    "UNKNOWN_ERROR",
    error instanceof Error ? error.message : "Unknown error",
    500,
  );
}
