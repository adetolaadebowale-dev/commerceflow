import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
} from "axios";

import {
  AdminApiError,
  type ApiErrorEnvelope,
  type ApiSuccessEnvelope,
} from "@/types/api";
import { getStoredAccessToken } from "@/services/token-storage";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ??
  "http://localhost:3000";

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
  (error: unknown) => Promise.reject(toAdminApiError(error)),
);

export async function apiRequest<T>(
  config: AxiosRequestConfig,
): Promise<T> {
  try {
    const response = await apiClient.request<ApiSuccessEnvelope<T> | ApiErrorEnvelope>(
      config,
    );
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
