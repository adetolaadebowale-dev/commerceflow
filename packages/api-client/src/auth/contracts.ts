import type {
  AuthenticatedUser,
  AuthTokens,
  User,
} from "@commerceflow/types";
import type {
  ForgotPasswordInput,
  LoginInput,
  RefreshTokenInput,
  RegisterInput,
  ResetPasswordInput,
} from "@commerceflow/validation";

import type { ApiSuccessResponse } from "../common/api-response";

/** POST /auth/register */
export type RegisterRequest = RegisterInput;

export interface RegisterResponseData {
  readonly user: User;
  readonly tokens: AuthTokens;
}

export type RegisterResponse = ApiSuccessResponse<RegisterResponseData>;

/** POST /auth/login */
export type LoginRequest = LoginInput;

export interface LoginResponseData {
  readonly user: User;
  readonly tokens: AuthTokens;
}

export type LoginResponse = ApiSuccessResponse<LoginResponseData>;

/** POST /auth/refresh */
export type RefreshTokenRequest = RefreshTokenInput;

export interface RefreshTokenResponseData {
  readonly tokens: AuthTokens;
}

export type RefreshTokenResponse =
  ApiSuccessResponse<RefreshTokenResponseData>;

/** POST /auth/logout */
export interface LogoutRequest {
  readonly refreshToken?: string;
}

export interface LogoutResponseData {
  readonly success: true;
}

export type LogoutResponse = ApiSuccessResponse<LogoutResponseData>;

/** POST /auth/forgot-password */
export type ForgotPasswordRequest = ForgotPasswordInput;

export interface ForgotPasswordResponseData {
  readonly message: string;
}

export type ForgotPasswordResponse =
  ApiSuccessResponse<ForgotPasswordResponseData>;

/** POST /auth/reset-password */
export type ResetPasswordRequest = Pick<
  ResetPasswordInput,
  "token" | "password"
>;

export interface ResetPasswordResponseData {
  readonly message: string;
}

export type ResetPasswordResponse =
  ApiSuccessResponse<ResetPasswordResponseData>;

/** GET /auth/me */
export type GetMeResponse = ApiSuccessResponse<AuthenticatedUser>;
