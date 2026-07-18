/**
 * Placeholder for automatic access-token refresh.
 * Sprint 13.0 restores sessions via AuthProvider; proactive refresh lands later.
 */
export function useTokenRefresh(): {
  readonly refresh: () => Promise<void>;
  readonly isRefreshing: boolean;
} {
  return {
    refresh: async () => {
      // Intentionally empty placeholder.
    },
    isRefreshing: false,
  };
}
