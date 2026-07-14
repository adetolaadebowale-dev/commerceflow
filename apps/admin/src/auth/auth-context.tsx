import { createContext, useContext } from "react";
import type { AuthenticatedUser } from "@commerceflow/types";
import type { LoginInput } from "@commerceflow/validation";

export interface AuthContextValue {
  readonly user: AuthenticatedUser | null;
  readonly isAuthenticated: boolean;
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly login: (input: LoginInput) => Promise<void>;
  readonly logout: () => Promise<void>;
  readonly clearError: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within SessionProvider");
  }

  return context;
}
