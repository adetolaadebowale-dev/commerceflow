import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ProtectedRoute } from "@/features/auth/protected-route";
import type { AuthContextValue } from "@/providers/auth-provider";

const replace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, push: vi.fn() }),
}));

const useAuthMock = vi.fn<() => AuthContextValue>();

vi.mock("@/providers/auth-provider", () => ({
  useAuth: () => useAuthMock(),
}));

describe("ProtectedRoute", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("shows a loading state while the session is restoring", () => {
    useAuthMock.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      error: null,
      storeName: "CommerceFlow Store",
      login: vi.fn(),
      logout: vi.fn(),
      clearError: vi.fn(),
    });

    render(
      <ProtectedRoute>
        <div>Secret</div>
      </ProtectedRoute>,
    );

    expect(screen.getByText("Loading session...")).toBeInTheDocument();
    expect(screen.queryByText("Secret")).not.toBeInTheDocument();
  });

  it("redirects unauthenticated users to login", async () => {
    useAuthMock.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      storeName: "CommerceFlow Store",
      login: vi.fn(),
      logout: vi.fn(),
      clearError: vi.fn(),
    });

    render(
      <ProtectedRoute>
        <div>Secret</div>
      </ProtectedRoute>,
    );

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith("/login");
    });
    expect(screen.queryByText("Secret")).not.toBeInTheDocument();
  });

  it("renders children when authenticated", () => {
    useAuthMock.mockReturnValue({
      user: {
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
      },
      isAuthenticated: true,
      isLoading: false,
      error: null,
      storeName: "CommerceFlow Store",
      login: vi.fn(),
      logout: vi.fn(),
      clearError: vi.fn(),
    });

    render(
      <ProtectedRoute>
        <div>Secret</div>
      </ProtectedRoute>,
    );

    expect(screen.getByText("Secret")).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });
});
