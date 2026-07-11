import type { GetMeResponse } from "@commerceflow/api-client";

import { AUTH_ERROR_CODES, AuthError } from "../errors";
import { authService } from "../services";
import { handleAuthRouteError, jsonSuccess } from "./http-response";
import { getBearerToken } from "./request-utils";

export async function handleGetMe(request: Request): Promise<Response> {
  try {
    const accessToken = getBearerToken(request);

    if (!accessToken) {
      throw new AuthError(
        AUTH_ERROR_CODES.UNAUTHENTICATED,
        "Authentication credentials were not provided",
        401,
      );
    }

    const result = await authService.getCurrentUser(accessToken);

    return jsonSuccess<GetMeResponse["data"]>(result);
  } catch (error) {
    return handleAuthRouteError(error);
  }
}
