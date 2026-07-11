import type { ApiErrorResponse, ApiSuccessResponse } from "@commerceflow/api-client";

import { AuthError } from "../errors";

export function jsonSuccess<T>(
  data: T,
  status = 200,
): Response {
  const body: ApiSuccessResponse<T> = { data };
  return Response.json(body, { status });
}

export function jsonError(
  error: ApiErrorResponse["error"],
  status: number,
): Response {
  const body: ApiErrorResponse = { error };
  return Response.json(body, { status });
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

  return jsonError(
    {
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected error occurred",
    },
    500,
  );
}
