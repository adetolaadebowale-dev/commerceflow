import type { ForgotPasswordResponseData } from "@commerceflow/api-client";
import { forgotPasswordSchema } from "@commerceflow/validation";

import { rateLimitService } from "@/platform-hardening/services/rate-limit.service";

import { AUTH_ERROR_CODES, AuthError } from "../errors";
import { handleAuthRouteError, jsonSuccess } from "./http-response";
import { getRateLimitIdentity } from "./request-utils";

/**
 * Accepts a password-reset request and always returns a generic success
 * message (does not reveal whether the email exists). Full email delivery
 * can be wired in a later sprint.
 */
export async function handleForgotPassword(request: Request): Promise<Response> {
  try {
    rateLimitService.assertAllowed(
      "auth.login",
      getRateLimitIdentity(request),
    );

    const body: unknown = await request.json();
    const parsed = forgotPasswordSchema.safeParse(body);

    if (!parsed.success) {
      throw new AuthError(
        AUTH_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    return jsonSuccess<ForgotPasswordResponseData>({
      message:
        "If an account exists for that email, password reset instructions have been sent.",
    });
  } catch (error) {
    return handleAuthRouteError(error);
  }
}
