import type { RefreshTokenResponse } from "@commerceflow/api-client";
import { refreshTokenSchema } from "@commerceflow/validation";

import { AUTH_ERROR_CODES, AuthError } from "../errors";
import { authService } from "../services";
import { handleAuthRouteError, jsonSuccess } from "./http-response";

export async function handleRefresh(request: Request): Promise<Response> {
  try {
    const body: unknown = await request.json();
    const parsed = refreshTokenSchema.safeParse(body);

    if (!parsed.success) {
      throw new AuthError(
        AUTH_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    const result = await authService.refreshToken(parsed.data);

    return jsonSuccess<RefreshTokenResponse["data"]>(result);
  } catch (error) {
    return handleAuthRouteError(error);
  }
}
