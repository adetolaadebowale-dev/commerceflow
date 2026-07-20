import { createAuthClient } from "@commerceflow/api-client";

import { API_BASE_URL } from "@/lib/env";
import {
  clearStoredTokens,
  getStoredAccessToken,
  getStoredRefreshToken,
  getStoredTokens,
  setStoredTokens,
} from "@/features/auth/auth-storage";

let refreshInFlight: Promise<string | null> | null = null;

const authClient = createAuthClient({
  baseUrl: API_BASE_URL,
  getAccessToken: getStoredAccessToken,
});

/**
 * Refresh the access token using the stored refresh token.
 * Concurrent callers share a single in-flight refresh.
 */
export async function refreshStoredAccessToken(): Promise<string | null> {
  if (refreshInFlight) {
    return refreshInFlight;
  }

  refreshInFlight = (async () => {
    const refreshToken =
      getStoredTokens()?.refreshToken ?? (await getStoredRefreshToken());

    if (!refreshToken) {
      await clearStoredTokens();
      return null;
    }

    try {
      const result = await authClient.refresh({ refreshToken });
      await setStoredTokens({
        accessToken: result.tokens.accessToken,
        refreshToken: result.tokens.refreshToken,
      });
      return result.tokens.accessToken;
    } catch {
      await clearStoredTokens();
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}
