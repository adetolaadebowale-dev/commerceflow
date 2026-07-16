import type { ApiErrorResponse, ApiSuccessResponse } from "@commerceflow/api-client";

import { respondKnownRouteError } from "@/lib/route-errors";
import { EmailError } from "../email/errors";
import { NotificationError } from "../errors";
import { SmsError } from "../sms/errors";

export function jsonSuccess<T>(data: T, status = 200): Response {
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

export function handleNotificationRouteError(error: unknown): Response {
  const known = respondKnownRouteError(error);
  if (known) {
    return known;
  }

  if (error instanceof NotificationError) {
    return jsonError(
      {
        code: error.code,
        message: error.message,
        details: error.details,
      },
      error.status,
    );
  }

  if (error instanceof EmailError) {
    return jsonError(
      {
        code: error.code,
        message: error.message,
        details: error.details,
      },
      error.status,
    );
  }

  if (error instanceof SmsError) {
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
