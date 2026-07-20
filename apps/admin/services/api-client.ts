import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";

import {
  AdminApiError,
  type ApiErrorEnvelope,
  type ApiSuccessEnvelope,
} from "@/types/api";
import { refreshStoredAccessToken } from "@/services/token-refresh";
import { getStoredAccessToken } from "@/services/token-storage";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ??
  "http://localhost:3000";

const AUTH_PATHS_WITHOUT_REFRESH = [
  "/api/auth/login",
  "/api/auth/refresh",
  "/api/auth/logout",
  "/api/auth/register",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
];

type RetryAxiosRequestConfig = InternalAxiosRequestConfig & {
  _authRetry?: boolean;
};

function isErrorEnvelope(payload: unknown): payload is ApiErrorEnvelope {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "error" in payload &&
    typeof (payload as ApiErrorEnvelope).error?.message === "string"
  );
}

function toAdminApiError(error: unknown): AdminApiError {
  if (error instanceof AdminApiError) {
    return error;
  }

  if (error instanceof AxiosError) {
    const payload = error.response?.data;
    if (isErrorEnvelope(payload)) {
      return new AdminApiError(
        payload.error.code,
        payload.error.message,
        error.response?.status ?? 500,
        payload.error.details,
      );
    }

    return new AdminApiError(
      "NETWORK_ERROR",
      error.message || "Network request failed",
      error.response?.status ?? 0,
    );
  }

  return new AdminApiError(
    "UNKNOWN_ERROR",
    error instanceof Error ? error.message : "Unknown error",
    500,
  );
}

function shouldSkipAuthRefresh(url: string | undefined): boolean {
  if (!url) {
    return false;
  }
  return AUTH_PATHS_WITHOUT_REFRESH.some((path) => url.includes(path));
}

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    Accept: "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const accessToken = getStoredAccessToken();

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!(error instanceof AxiosError) || error.response?.status !== 401) {
      return Promise.reject(toAdminApiError(error));
    }

    const original = error.config as RetryAxiosRequestConfig | undefined;
    if (
      !original ||
      original._authRetry ||
      shouldSkipAuthRefresh(original.url)
    ) {
      return Promise.reject(toAdminApiError(error));
    }

    const refreshedAccessToken = await refreshStoredAccessToken();
    if (!refreshedAccessToken) {
      return Promise.reject(toAdminApiError(error));
    }

    original._authRetry = true;
    original.headers = original.headers ?? {};
    original.headers.Authorization = `Bearer ${refreshedAccessToken}`;
    try {
      return await apiClient.request(original);
    } catch (retryError) {
      return Promise.reject(toAdminApiError(retryError));
    }
  },
);

export async function apiRequest<T>(
  config: AxiosRequestConfig,
): Promise<T> {
  try {
    const response = await apiClient.request<
      ApiSuccessEnvelope<T> | ApiErrorEnvelope
    >(config);
    const payload = response.data;

    if (isErrorEnvelope(payload)) {
      throw new AdminApiError(
        payload.error.code,
        payload.error.message,
        response.status,
        payload.error.details,
      );
    }

    return payload.data;
  } catch (error) {
    throw toAdminApiError(error);
  }
}

export { API_BASE_URL };
