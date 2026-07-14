import type { ApiErrorResponse } from "@commerceflow/api-client";

import { AuthError } from "@/auth/errors";
import { AuthorizationError } from "@/authorization/errors";

export function mapKnownRouteError(error: unknown): {
  body: ApiErrorResponse;
  status: number;
} | null {
  if (error instanceof AuthError) {
    return {
      status: error.status,
      body: {
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      },
    };
  }

  if (error instanceof AuthorizationError) {
    return {
      status: error.status,
      body: {
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      },
    };
  }

  return null;
}

export function respondKnownRouteError(error: unknown): Response | null {
  const mapped = mapKnownRouteError(error);

  if (!mapped) {
    return null;
  }

  return Response.json(mapped.body, { status: mapped.status });
}
