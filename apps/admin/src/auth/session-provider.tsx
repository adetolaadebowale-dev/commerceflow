import {
  createAuthClient,
  ApiClientError,
} from "@commerceflow/api-client";
import type { AuthenticatedUser } from "@commerceflow/types";
import type { LoginInput } from "@commerceflow/validation";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import { AuthContext, type AuthContextValue } from "./auth-context";
import {
  clearStoredTokens,
  getStoredAccessToken,
  getStoredRefreshToken,
  getStoredTokens,
  setStoredTokens,
} from "./auth-storage";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

interface SessionProviderProps {
  readonly children: ReactNode;
}

export function SessionProvider({ children }: SessionProviderProps) {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const authClient = useMemo(
    () =>
      createAuthClient({
        baseUrl: API_BASE_URL,
        getAccessToken: getStoredAccessToken,
      }),
    [],
  );

  const restoreSession = useCallback(async (): Promise<void> => {
    const storedTokens = getStoredTokens();

    if (!storedTokens) {
      setUser(null);
      return;
    }

    try {
      const currentUser = await authClient.getMe(storedTokens.accessToken);
      setUser(currentUser);
      return;
    } catch (initialError) {
      if (
        !(initialError instanceof ApiClientError) ||
        initialError.status !== 401
      ) {
        clearStoredTokens();
        setUser(null);
        return;
      }
    }

    try {
      const refreshed = await authClient.refresh({
        refreshToken: storedTokens.refreshToken,
      });

      setStoredTokens({
        accessToken: refreshed.tokens.accessToken,
        refreshToken: refreshed.tokens.refreshToken,
      });

      const currentUser = await authClient.getMe(refreshed.tokens.accessToken);
      setUser(currentUser);
    } catch {
      clearStoredTokens();
      setUser(null);
    }
  }, [authClient]);

  useEffect(() => {
    let isMounted = true;

    async function initializeSession(): Promise<void> {
      try {
        await restoreSession();
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void initializeSession();

    return () => {
      isMounted = false;
    };
  }, [restoreSession]);

  const login = useCallback(
    async (input: LoginInput): Promise<void> => {
      setError(null);

      const result = await authClient.login(input);

      setStoredTokens({
        accessToken: result.tokens.accessToken,
        refreshToken: result.tokens.refreshToken,
      });

      const currentUser = await authClient.getMe(result.tokens.accessToken);
      setUser(currentUser);
    },
    [authClient],
  );

  const logout = useCallback(async (): Promise<void> => {
    setError(null);

    try {
      const refreshToken = getStoredRefreshToken();

      await authClient.logout(
        refreshToken ? { refreshToken } : undefined,
      );
    } catch {
      // Local session is cleared even if the API logout request fails.
    } finally {
      clearStoredTokens();
      setUser(null);
    }
  }, [authClient]);

  const clearError = useCallback((): void => {
    setError(null);
  }, []);

  const value: AuthContextValue = {
    user,
    isAuthenticated: user !== null,
    isLoading,
    error,
    login,
    logout,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}
