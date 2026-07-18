import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AuthProvider, useAuth } from "@/providers/auth-provider";
import { authService } from "@/services/auth.service";
import {
  clearStoredTokens,
  setStoredTokens,
} from "@/services/token-storage";

vi.mock("@/services/auth.service", () => ({
  authService: {
    login: vi.fn(),
    logout: vi.fn(),
    getMe: vi.fn(),
    refresh: vi.fn(),
  },
}));

function AuthProbe() {
  const auth = useAuth();

  return (
    <div>
      <span data-testid="auth-state">
        {auth.isLoading
          ? "loading"
          : auth.isAuthenticated
            ? "authenticated"
            : "anonymous"}
      </span>
      <span data-testid="user-email">{auth.user?.user.email ?? ""}</span>
      <button type="button" onClick={() => void auth.logout()}>
        Logout
      </button>
      <button
        type="button"
        onClick={() =>
          void auth.login({
            email: "admin@example.com",
            password: "password123",
          })
        }
      >
        Login
      </button>
    </div>
  );
}

const session = {
  user: {
    id: "user-1",
    email: "admin@example.com",
    firstName: "Ada",
    lastName: "Admin",
    role: "admin",
  },
  permissions: [],
  session: {
    id: "session-1",
    userId: "user-1",
    expiresAt: "2099-01-01T00:00:00.000Z",
    createdAt: "2026-01-01T00:00:00.000Z",
    lastActiveAt: "2026-01-01T00:00:00.000Z",
  },
};

describe("AuthProvider", () => {
  beforeEach(() => {
    clearStoredTokens();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
    clearStoredTokens();
  });

  it("restores an authenticated session from stored tokens", async () => {
    setStoredTokens({
      accessToken: "access-token",
      refreshToken: "refresh-token",
    });
    vi.mocked(authService.getMe).mockResolvedValue(session);

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("auth-state")).toHaveTextContent(
        "authenticated",
      );
    });
    expect(screen.getByTestId("user-email")).toHaveTextContent(
      "admin@example.com",
    );
  });

  it("logs in and stores the authenticated user", async () => {
    const user = userEvent.setup();
    vi.mocked(authService.login).mockResolvedValue({
      user: session.user,
      tokens: {
        accessToken: "access-token",
        refreshToken: "refresh-token",
        accessTokenExpiresAt: "2099-01-01T00:00:00.000Z",
        refreshTokenExpiresAt: "2099-01-01T00:00:00.000Z",
        tokenType: "Bearer",
      },
    });
    vi.mocked(authService.getMe).mockResolvedValue(session);

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("auth-state")).toHaveTextContent("anonymous");
    });

    await user.click(screen.getByRole("button", { name: "Login" }));

    await waitFor(() => {
      expect(screen.getByTestId("auth-state")).toHaveTextContent(
        "authenticated",
      );
    });
    expect(authService.login).toHaveBeenCalledWith({
      email: "admin@example.com",
      password: "password123",
    });
  });

  it("logs out and clears authentication state", async () => {
    const user = userEvent.setup();
    setStoredTokens({
      accessToken: "access-token",
      refreshToken: "refresh-token",
    });
    vi.mocked(authService.getMe).mockResolvedValue(session);
    vi.mocked(authService.logout).mockResolvedValue({ success: true });

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("auth-state")).toHaveTextContent(
        "authenticated",
      );
    });

    await user.click(screen.getByRole("button", { name: "Logout" }));

    await waitFor(() => {
      expect(screen.getByTestId("auth-state")).toHaveTextContent("anonymous");
    });
    expect(authService.logout).toHaveBeenCalled();
  });
});
