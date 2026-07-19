"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { getConfiguredStoreId } from "@/lib/store";
import { authService } from "@/services/auth.service";
import {
  clearStoredTokens,
  getStoredRefreshToken,
  getStoredTokens,
  setStoredTokens,
} from "@/services/token-storage";
import { AdminApiError } from "@/types/api";
import type { AuthenticatedSession, LoginPayload } from "@/types/auth";

export interface AuthContextValue {
  readonly user: AuthenticatedSession | null;
  readonly isAuthenticated: boolean;
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly storeId: string | null;
  readonly storeName: string;
  readonly login: (input: LoginPayload) => Promise<void>;
  readonly logout: () => Promise<void>;
  readonly clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const DEFAULT_STORE_NAME = "CommerceFlow Store";

interface AuthProviderProps {
  readonly children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthenticatedSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const restoreSession = useCallback(async (): Promise<void> => {
    const storedTokens = getStoredTokens();

    if (!storedTokens) {
      setUser(null);
      return;
    }

    try {
      const currentUser = await authService.getMe();
      setUser(currentUser);
      return;
    } catch (initialError) {
      if (
        !(initialError instanceof AdminApiError) ||
        initialError.status !== 401
      ) {
        clearStoredTokens();
        setUser(null);
        return;
      }
    }

    try {
      const refreshed = await authService.refresh(storedTokens.refreshToken);
      setStoredTokens({
        accessToken: refreshed.tokens.accessToken,
        refreshToken: refreshed.tokens.refreshToken,
      });
      const currentUser = await authService.getMe();
      setUser(currentUser);
    } catch {
      clearStoredTokens();
      setUser(null);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function initialize(): Promise<void> {
      try {
        await restoreSession();
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void initialize();

    return () => {
      isMounted = false;
    };
  }, [restoreSession]);

  const login = useCallback(async (input: LoginPayload): Promise<void> => {
    setError(null);
    const result = await authService.login(input);
    setStoredTokens({
      accessToken: result.tokens.accessToken,
      refreshToken: result.tokens.refreshToken,
    });
    const currentUser = await authService.getMe();
    setUser(currentUser);
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    setError(null);

    try {
      const refreshToken = getStoredRefreshToken();
      await authService.logout(refreshToken ?? undefined);
    } catch {
      // Clear local session even if the API call fails.
    } finally {
      clearStoredTokens();
      setUser(null);
    }
  }, []);

  const clearError = useCallback((): void => {
    setError(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      isLoading,
      error,
      storeId: getConfiguredStoreId(),
      storeName: DEFAULT_STORE_NAME,
      login,
      logout,
      clearError,
    }),
    [user, isLoading, error, login, logout, clearError],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
