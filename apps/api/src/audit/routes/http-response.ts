import type { ApiErrorResponse } from "@commerceflow/api-client";

import { respondKnownRouteError } from "@/lib/route-errors";
import { AUDIT_ERROR_CODES, AuditError } from "../errors";

export function jsonSuccess<T>(data: T, status = 200): Response {
  return Response.json({ data }, { status });
}

export function handleAuditRouteError(error: unknown): Response {
  const known = respondKnownRouteError(error);

  if (known) {
    return known;
  }

  if (error instanceof AuditError) {
    const body: ApiErrorResponse = {
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
    };

    return Response.json(body, { status: error.status });
  }

  const body: ApiErrorResponse = {
    error: {
      code: AUDIT_ERROR_CODES.VALIDATION_ERROR,
      message: "An unexpected error occurred",
    },
  };

  return Response.json(body, { status: 500 });
}
