import { refreshStoredAccessToken } from "@/services/token-refresh";

/**
 * Access-token refresh hook. HTTP clients also refresh automatically on 401.
 */
export function useTokenRefresh(): {
  readonly refresh: () => Promise<void>;
  readonly isRefreshing: boolean;
} {
  return {
    refresh: async () => {
      await refreshStoredAccessToken();
    },
    isRefreshing: false,
  };
}
