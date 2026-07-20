import type { ApiErrorResponse, ApiSuccessResponse } from "../common/api-response";
import { ApiClientError } from "./api-error";

export interface ApiClientConfig {
  readonly baseUrl: string;
  readonly getAccessToken?: () => string | null;
  /** Optional single-flight refresh used once per request on HTTP 401. */
  readonly refreshAccessToken?: () => Promise<string | null>;
}

interface RequestOptions {
  readonly method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  readonly path: string;
  readonly body?: unknown;
  /** When true, body is sent as FormData and Content-Type is left unset. */
  readonly formData?: boolean;
  readonly accessToken?: string | null;
  readonly hasRetried?: boolean;
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

  let body: BodyInit | undefined;
  if (options.body !== undefined) {
    if (options.formData) {
      if (!(options.body instanceof FormData)) {
        throw new Error("formData requests require a FormData body");
      }
      body = options.body;
    } else {
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(options.body);
    }
  }

  const response = await fetch(`${config.baseUrl}${options.path}`, {
    method: options.method,
    headers,
    body,
  });

  const payload = (await response.json()) as
    | ApiSuccessResponse<T>
    | ApiErrorResponse;

  if (
    response.status === 401 &&
    !options.hasRetried &&
    config.refreshAccessToken
  ) {
    const refreshedAccessToken = await config.refreshAccessToken();
    if (refreshedAccessToken) {
      return apiRequest<T>(config, {
        ...options,
        accessToken: refreshedAccessToken,
        hasRetried: true,
      });
    }
  }

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
