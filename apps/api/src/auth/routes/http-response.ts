import type { ApiErrorResponse, ApiSuccessResponse } from "@commerceflow/api-client";

import { PlatformHardeningError } from "@/platform-hardening/errors";

import { AuthError } from "../errors";

export function jsonSuccess<T>(data: T, status = 200): Response {
  const body: ApiSuccessResponse<T> = { data };
  return Response.json(body, { status });
}

export function jsonError(
  error: ApiErrorResponse["error"],
  status: number,
  headers?: HeadersInit,
): Response {
  const body: ApiErrorResponse = { error };
  return Response.json(body, { status, headers });
}

function rateLimitResponseHeaders(details: unknown): HeadersInit | undefined {
  if (
    typeof details !== "object" ||
    details === null ||
    !("resetAt" in details) ||
    typeof (details as { resetAt: unknown }).resetAt !== "string"
  ) {
    return undefined;
  }

  const resetAtMs = Date.parse((details as { resetAt: string }).resetAt);
  if (Number.isNaN(resetAtMs)) {
    return undefined;
  }

  const retryAfterSeconds = Math.max(
    1,
    Math.ceil((resetAtMs - Date.now()) / 1000),
  );

  return { "Retry-After": String(retryAfterSeconds) };
}

/** Public rate-limit details only — never include secrets or stacks. */
function sanitizeRateLimitDetails(details: unknown): unknown {
  if (typeof details !== "object" || details === null) {
    return undefined;
  }

  const record = details as Record<string, unknown>;
  return {
    remaining: record.remaining,
    resetAt: record.resetAt,
    limit: record.limit,
    windowMs: record.windowMs,
  };
}

export function handleAuthRouteError(error: unknown): Response {
  if (error instanceof AuthError) {
    return jsonError(
      {
        code: error.code,
        message: error.message,
        details: error.details,
      },
      error.status,
    );
  }

  if (error instanceof PlatformHardeningError) {
    return jsonError(
      {
        code: error.code,
        message: error.message,
        details:
          error.status === 429
            ? sanitizeRateLimitDetails(error.details)
            : undefined,
      },
      error.status,
      error.status === 429 ? rateLimitResponseHeaders(error.details) : undefined,
    );
  }

  return jsonError(
    {
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected error occurred",
    },
    500,
  );
}
