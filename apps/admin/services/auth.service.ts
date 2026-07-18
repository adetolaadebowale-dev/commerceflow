import { apiRequest } from "@/services/api-client";
import type {
  AuthenticatedSession,
  AuthTokens,
  LoginPayload,
} from "@/types/auth";

export interface LoginResult {
  readonly user: AuthenticatedSession["user"];
  readonly tokens: AuthTokens;
}

export const authService = {
  login(input: LoginPayload): Promise<LoginResult> {
    return apiRequest<LoginResult>({
      method: "POST",
      url: "/api/auth/login",
      data: input,
    });
  },

  logout(refreshToken?: string): Promise<{ success: true }> {
    return apiRequest<{ success: true }>({
      method: "POST",
      url: "/api/auth/logout",
      data: refreshToken ? { refreshToken } : undefined,
    });
  },

  getMe(): Promise<AuthenticatedSession> {
    return apiRequest<AuthenticatedSession>({
      method: "GET",
      url: "/api/auth/me",
    });
  },

  refresh(refreshToken: string): Promise<{ tokens: AuthTokens }> {
    return apiRequest<{ tokens: AuthTokens }>({
      method: "POST",
      url: "/api/auth/refresh",
      data: { refreshToken },
    });
  },
};
