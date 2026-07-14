import {
  apiRequest,
  ApiClientError,
  createAuthClient,
  type RegisterResponseData,
} from "@commerceflow/api-client";
import type { LoginInput, RegisterInput } from "@commerceflow/validation";
import * as SplashScreen from "expo-splash-screen";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { API_BASE_URL } from "../config/api";
import { AuthContext, type AuthContextValue } from "./auth-context";
import {
  clearStoredTokens,
  getStoredAccessToken,
  getStoredRefreshToken,
  getStoredTokens,
  hydrateTokenCache,
  setStoredTokens,
} from "./auth-storage";

console.log("[startup][session-provider.tsx] module loaded");

void SplashScreen.preventAutoHideAsync()
  .then(() => {
    console.log("[startup][session-provider.tsx] SplashScreen.preventAutoHideAsync resolved");
  })
  .catch((error) => {
    console.warn(
      "[startup][session-provider.tsx] SplashScreen.preventAutoHideAsync rejected",
      error,
    );
  });

interface SessionProviderProps {
  readonly children: ReactNode;
}

export function SessionProvider({ children }: SessionProviderProps) {
  console.log("[startup][session-provider.tsx] SessionProvider render start");
  const [user, setUser] = useState<AuthContextValue["user"]>(null);
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

  const establishSession = useCallback(
    async (accessToken: string, refreshToken: string): Promise<void> => {
      await setStoredTokens({ accessToken, refreshToken });
      const currentUser = await authClient.getMe(accessToken);
      setUser(currentUser);
    },
    [authClient],
  );

  const restoreSession = useCallback(async (): Promise<void> => {
    console.log("[startup][session-provider.tsx] restoreSession start");
    await hydrateTokenCache();
    const storedTokens = getStoredTokens();
    console.log("[startup][session-provider.tsx] restoreSession tokens", {
      hasStoredTokens: Boolean(storedTokens),
    });

    if (!storedTokens) {
      console.log("[startup][session-provider.tsx] restoreSession no tokens");
      setUser(null);
      return;
    }

    try {
      console.log("[startup][session-provider.tsx] restoreSession getMe start");
      const currentUser = await authClient.getMe(storedTokens.accessToken);
      console.log("[startup][session-provider.tsx] restoreSession getMe success");
      setUser(currentUser);
      return;
    } catch (initialError) {
      console.warn(
        "[startup][session-provider.tsx] restoreSession getMe failed",
        initialError,
      );
      if (
        !(initialError instanceof ApiClientError) ||
        initialError.status !== 401
      ) {
        await clearStoredTokens();
        setUser(null);
        return;
      }
    }

    try {
      const refreshed = await authClient.refresh({
        refreshToken: storedTokens.refreshToken,
      });

      await establishSession(
        refreshed.tokens.accessToken,
        refreshed.tokens.refreshToken,
      );
    } catch {
      await clearStoredTokens();
      setUser(null);
    }
  }, [authClient, establishSession]);

  useEffect(() => {
    let isMounted = true;

    async function initializeSession(): Promise<void> {
      console.log("[startup][session-provider.tsx] initializeSession start");
      try {
        await restoreSession();
        console.log("[startup][session-provider.tsx] restoreSession complete");
      } catch (error) {
        console.error(
          "[startup][session-provider.tsx] initializeSession failed",
          error,
        );
      } finally {
        if (isMounted) {
          console.log("[startup][session-provider.tsx] setIsLoading(false)");
          setIsLoading(false);
          try {
            await SplashScreen.hideAsync();
            console.log("[startup][session-provider.tsx] SplashScreen.hideAsync resolved");
          } catch (error) {
            console.warn(
              "[startup][session-provider.tsx] SplashScreen.hideAsync rejected",
              error,
            );
          }
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
      await establishSession(
        result.tokens.accessToken,
        result.tokens.refreshToken,
      );
    },
    [authClient, establishSession],
  );

  const register = useCallback(
    async (input: RegisterInput): Promise<void> => {
      setError(null);

      const result = await apiRequest<RegisterResponseData>(
        {
          baseUrl: API_BASE_URL,
          getAccessToken: getStoredAccessToken,
        },
        {
          method: "POST",
          path: "/api/auth/register",
          body: input,
        },
      );

      await establishSession(
        result.tokens.accessToken,
        result.tokens.refreshToken,
      );
    },
    [establishSession],
  );

  const logout = useCallback(async (): Promise<void> => {
    setError(null);

    try {
      const refreshToken = await getStoredRefreshToken();

      await authClient.logout(
        refreshToken ? { refreshToken } : undefined,
      );
    } catch {
      // Local session is cleared even if the API logout request fails.
    } finally {
      await clearStoredTokens();
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
    register,
    logout,
    clearError,
  };

  console.log("[startup][session-provider.tsx] SessionProvider render end", {
    isLoading,
    isAuthenticated: user !== null,
  });

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
