import {
  ApiClientError,
  apiRequest,
  createAuthClient,
  type RegisterResponseData,
} from "@commerceflow/api-client";
import type { AuthenticatedUser } from "@commerceflow/types";
import type {
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
} from "@commerceflow/validation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  clearStoredTokens,
  getStoredAccessToken,
  getStoredRefreshToken,
  getStoredTokens,
  hydrateTokenCache,
  setStoredTokens,
} from "@/features/auth/auth-storage";
import { refreshStoredAccessToken } from "@/features/auth/token-refresh";
import { config } from "@/lib/config";

export interface AuthContextValue {
  readonly user: AuthenticatedUser | null;
  readonly isAuthenticated: boolean;
  readonly isBootstrapping: boolean;
  readonly error: string | null;
  readonly login: (input: LoginInput) => Promise<void>;
  readonly register: (input: RegisterInput) => Promise<void>;
  readonly forgotPassword: (
    input: ForgotPasswordInput,
  ) => Promise<{ message: string }>;
  readonly logout: () => Promise<void>;
  readonly clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  readonly children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const authClient = useMemo(
    () =>
      createAuthClient({
        baseUrl: config.apiBaseUrl,
        getAccessToken: getStoredAccessToken,
        refreshAccessToken: refreshStoredAccessToken,
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

  const bootstrapSession = useCallback(async (): Promise<void> => {
    await hydrateTokenCache();
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
        await clearStoredTokens();
        setUser(null);
        return;
      }
    }

    const refreshedAccessToken = await refreshStoredAccessToken();
    if (!refreshedAccessToken) {
      setUser(null);
      return;
    }

    try {
      const currentUser = await authClient.getMe(refreshedAccessToken);
      setUser(currentUser);
    } catch {
      await clearStoredTokens();
      setUser(null);
    }
  }, [authClient]);

  useEffect(() => {
    let mounted = true;

    void (async () => {
      try {
        await bootstrapSession();
      } finally {
        if (mounted) {
          setIsBootstrapping(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [bootstrapSession]);

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
          baseUrl: config.apiBaseUrl,
          getAccessToken: getStoredAccessToken,
          refreshAccessToken: refreshStoredAccessToken,
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

  const forgotPassword = useCallback(
    async (input: ForgotPasswordInput): Promise<{ message: string }> => {
      setError(null);
      return authClient.forgotPassword(input);
    },
    [authClient],
  );

  const logout = useCallback(async (): Promise<void> => {
    setError(null);
    try {
      const refreshToken = await getStoredRefreshToken();
      await authClient.logout(refreshToken ? { refreshToken } : undefined);
    } catch {
      // Clear local session even if logout request fails.
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
    isBootstrapping,
    error,
    login,
    register,
    forgotPassword,
    logout,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
