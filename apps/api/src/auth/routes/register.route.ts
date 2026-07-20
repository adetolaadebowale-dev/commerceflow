import type { RegisterResponse } from "@commerceflow/api-client";
import { registerSchema } from "@commerceflow/validation";

import { rateLimitService } from "@/platform-hardening/services/rate-limit.service";

import { AUTH_ERROR_CODES, AuthError } from "../errors";
import { authService } from "../services";
import { handleAuthRouteError, jsonSuccess } from "./http-response";
import { getRateLimitIdentity, getRequestContext } from "./request-utils";

export async function handleRegister(request: Request): Promise<Response> {
  try {
    // Rate limit before registration validation / authentication.
    rateLimitService.assertAllowed(
      "auth.register",
      getRateLimitIdentity(request),
    );

    const body: unknown = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      throw new AuthError(
        AUTH_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    const result = await authService.register(
      parsed.data,
      getRequestContext(request),
    );

    return jsonSuccess<RegisterResponse["data"]>(result, 201);
  } catch (error) {
    return handleAuthRouteError(error);
  }
}
