import type { LoginResponse } from "@commerceflow/api-client";
import { loginSchema } from "@commerceflow/validation";

import { rateLimitService } from "@/platform-hardening/services/rate-limit.service";

import { AUTH_ERROR_CODES, AuthError } from "../errors";
import { authService } from "../services";
import { handleAuthRouteError, jsonSuccess } from "./http-response";
import { getRateLimitIdentity, getRequestContext } from "./request-utils";

export async function handleLogin(request: Request): Promise<Response> {
  try {
    // Rate limit before credential validation / authentication.
    rateLimitService.assertAllowed(
      "auth.login",
      getRateLimitIdentity(request),
    );

    const body: unknown = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      throw new AuthError(
        AUTH_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    const result = await authService.login(
      parsed.data,
      getRequestContext(request),
    );

    return jsonSuccess<LoginResponse["data"]>(result);
  } catch (error) {
    return handleAuthRouteError(error);
  }
}
