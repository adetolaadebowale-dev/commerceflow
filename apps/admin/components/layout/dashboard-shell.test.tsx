import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Sidebar } from "@/components/layout/sidebar";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import type { AuthContextValue } from "@/providers/auth-provider";

const replace = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
  useRouter: () => ({ replace, push: vi.fn() }),
}));

vi.mock("@/providers/auth-provider", () => ({
  useAuth: (): AuthContextValue => ({
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
  }),
}));

describe("Dashboard layout", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders navigation items with only Dashboard enabled", () => {
    render(<Sidebar open />);

    expect(
      screen.getByRole("link", { name: /Dashboard/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("Products")).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    expect(screen.getByText("Orders")).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByText("Platform")).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  });

  it("renders shell chrome with brand and store name", () => {
    render(
      <DashboardShell>
        <div>Page content</div>
      </DashboardShell>,
    );

    expect(screen.getByText("CommerceFlow")).toBeInTheDocument();
    expect(screen.getByText("CommerceFlow Store")).toBeInTheDocument();
    expect(screen.getByText("Page content")).toBeInTheDocument();
    expect(screen.getByRole("navigation")).toBeInTheDocument();
  });
});
