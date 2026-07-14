import { createContext, useContext } from "react";
import type { AuthenticatedUser } from "@commerceflow/types";
import type { LoginInput, RegisterInput } from "@commerceflow/validation";

console.log("[startup][auth-context.tsx] module loaded");

export interface AuthContextValue {
  readonly user: AuthenticatedUser | null;
  readonly isAuthenticated: boolean;
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly login: (input: LoginInput) => Promise<void>;
  readonly register: (input: RegisterInput) => Promise<void>;
  readonly logout: () => Promise<void>;
  readonly clearError: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  console.log("[startup][auth-context.tsx] useAuth called");
  const context = useContext(AuthContext);

  if (!context) {
    console.error("[startup][auth-context.tsx] useAuth called outside provider");
    throw new Error("useAuth must be used within SessionProvider");
  }

  return context;
}
