import type { LogoutResponse } from "@commerceflow/api-client";

import { AUTH_ERROR_CODES, AuthError } from "../errors";
import { authService } from "../services";
import { handleAuthRouteError, jsonSuccess } from "./http-response";
import { getBearerToken } from "./request-utils";

function parseLogoutBody(body: unknown): { refreshToken?: string } {
  if (body === undefined || body === null) {
    return {};
  }

  if (typeof body !== "object" || Array.isArray(body)) {
    throw new AuthError(
      AUTH_ERROR_CODES.VALIDATION_ERROR,
      "Validation failed",
      400,
    );
  }

  const record = body as Record<string, unknown>;

  if (record.refreshToken === undefined) {
    return {};
  }

  if (typeof record.refreshToken !== "string") {
    throw new AuthError(
      AUTH_ERROR_CODES.VALIDATION_ERROR,
      "Validation failed",
      400,
    );
  }

  const refreshToken = record.refreshToken.trim();

  if (refreshToken.length === 0) {
    throw new AuthError(
      AUTH_ERROR_CODES.VALIDATION_ERROR,
      "Validation failed",
      400,
    );
  }

  return { refreshToken };
}

export async function handleLogout(request: Request): Promise<Response> {
  try {
    let refreshToken: string | undefined;

    if (request.headers.get("content-type")?.includes("application/json")) {
      const body: unknown = await request.json();
      refreshToken = parseLogoutBody(body).refreshToken;
    }

    const result = await authService.logout({
      accessToken: getBearerToken(request) ?? undefined,
      refreshToken,
    });

    return jsonSuccess<LogoutResponse["data"]>(result);
  } catch (error) {
    return handleAuthRouteError(error);
  }
}
