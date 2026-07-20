import {
  clearStoredTokens,
  getStoredRefreshToken,
  setStoredTokens,
} from "@/services/token-storage";

function getApiBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ??
    "http://localhost:3000"
  );
}

let refreshInFlight: Promise<string | null> | null = null;

/**
 * Exchange the stored refresh token for a new access token.
 * Single-flight so concurrent 401s share one refresh.
 */
export async function refreshStoredAccessToken(): Promise<string | null> {
  if (refreshInFlight) {
    return refreshInFlight;
  }

  refreshInFlight = (async () => {
    const refreshToken = getStoredRefreshToken();
    if (!refreshToken) {
      return null;
    }

    try {
      const response = await fetch(`${getApiBaseUrl()}/api/auth/refresh`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refreshToken }),
      });

      const payload = (await response.json()) as {
        data?: {
          tokens?: {
            accessToken?: string;
            refreshToken?: string;
          };
        };
        error?: { message?: string };
      };

      const accessToken = payload.data?.tokens?.accessToken;
      const nextRefreshToken = payload.data?.tokens?.refreshToken;

      if (!response.ok || !accessToken || !nextRefreshToken) {
        clearStoredTokens();
        return null;
      }

      setStoredTokens({
        accessToken,
        refreshToken: nextRefreshToken,
      });

      return accessToken;
    } catch {
      clearStoredTokens();
      return null;
    }
  })();

  try {
    return await refreshInFlight;
  } finally {
    refreshInFlight = null;
  }
}
