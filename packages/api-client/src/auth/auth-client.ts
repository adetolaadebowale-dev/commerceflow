import type { AuthenticatedUser } from "@commerceflow/types";

import type {
  ForgotPasswordRequest,
  ForgotPasswordResponseData,
  GetMeResponse,
  LoginRequest,
  LoginResponseData,
  LogoutRequest,
  LogoutResponseData,
  RefreshTokenRequest,
  RefreshTokenResponseData,
} from "./contracts";
import type { ApiClientConfig } from "../http/request";
import { apiRequest } from "../http/request";

export interface AuthClient {
  login(input: LoginRequest): Promise<LoginResponseData>;
  logout(input?: LogoutRequest): Promise<LogoutResponseData>;
  refresh(input: RefreshTokenRequest): Promise<RefreshTokenResponseData>;
  forgotPassword(
    input: ForgotPasswordRequest,
  ): Promise<ForgotPasswordResponseData>;
  getMe(accessToken?: string): Promise<AuthenticatedUser>;
}

export function createAuthClient(config: ApiClientConfig): AuthClient {
  return {
    login: (input) =>
      apiRequest<LoginResponseData>(config, {
        method: "POST",
        path: "/api/auth/login",
        body: input,
      }),

    logout: (input) =>
      apiRequest<LogoutResponseData>(config, {
        method: "POST",
        path: "/api/auth/logout",
        body: input,
        accessToken: config.getAccessToken?.(),
      }),

    refresh: (input) =>
      apiRequest<RefreshTokenResponseData>(config, {
        method: "POST",
        path: "/api/auth/refresh",
        body: input,
      }),

    forgotPassword: (input) =>
      apiRequest<ForgotPasswordResponseData>(config, {
        method: "POST",
        path: "/api/auth/forgot-password",
        body: input,
      }),

    getMe: (accessToken) =>
      apiRequest<GetMeResponse["data"]>(config, {
        method: "GET",
        path: "/api/auth/me",
        accessToken: accessToken ?? config.getAccessToken?.(),
      }),
  };
}
