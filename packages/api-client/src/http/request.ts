import type { ApiErrorResponse, ApiSuccessResponse } from "../common/api-response";
import { ApiClientError } from "./api-error";

export interface ApiClientConfig {
  readonly baseUrl: string;
  readonly getAccessToken?: () => string | null;
}

interface RequestOptions {
  readonly method: "GET" | "POST";
  readonly path: string;
  readonly body?: unknown;
  readonly accessToken?: string | null;
}

function isErrorResponse<T>(
  response: ApiSuccessResponse<T> | ApiErrorResponse,
): response is ApiErrorResponse {
  return "error" in response;
}

export async function apiRequest<T>(
  config: ApiClientConfig,
  options: RequestOptions,
): Promise<T> {
  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  const accessToken = options.accessToken ?? config.getAccessToken?.();

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${config.baseUrl}${options.path}`, {
    method: options.method,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  const payload = (await response.json()) as
    | ApiSuccessResponse<T>
    | ApiErrorResponse;

  if (!response.ok || isErrorResponse(payload)) {
    const error = isErrorResponse(payload)
      ? payload.error
      : {
          code: "UNKNOWN_ERROR",
          message: "Request failed",
        };

    throw new ApiClientError(
      error.code,
      error.message,
      response.status,
      "details" in error ? error.details : undefined,
    );
  }

  return payload.data;
}
