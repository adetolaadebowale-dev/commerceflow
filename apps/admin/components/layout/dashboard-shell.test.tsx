import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Sidebar } from "@/components/layout/sidebar";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import type { AuthContextValue } from "@/providers/auth-provider";

const replace = vi.fn();
const pathnameMock = vi.fn(() => "/dashboard");

vi.mock("next/navigation", () => ({
  usePathname: () => pathnameMock(),
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
    storeId: "11111111-1111-1111-1111-111111111111",
    storeName: "CommerceFlow Store",
    login: vi.fn(),
    logout: vi.fn(),
    clearError: vi.fn(),
  }),
}));

describe("Dashboard layout", () => {
  afterEach(() => {
    cleanup();
    pathnameMock.mockReturnValue("/dashboard");
  });

  it("renders only finished navigation destinations", () => {
    render(<Sidebar open />);

    expect(
      screen.getByRole("link", { name: /Dashboard/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Products/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Brands/i })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Warehouses/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Orders/i })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Customers/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Reports/i })).toBeInTheDocument();
    expect(screen.queryByText("Inventory")).not.toBeInTheDocument();
    expect(screen.queryByText("Categories")).not.toBeInTheDocument();
    expect(screen.queryByText("Platform")).not.toBeInTheDocument();
  });

  it("does not mark Dashboard active on nested product routes", () => {
    pathnameMock.mockReturnValue("/dashboard/products");
    render(<Sidebar open />);

    const dashboardLink = screen.getByRole("link", { name: /Dashboard/i });
    const productsLink = screen.getByRole("link", { name: /Products/i });

    expect(dashboardLink.className).toContain(
      "text-[var(--color-muted-foreground)]",
    );
    expect(productsLink.className).toContain("bg-[var(--color-muted)]");
    expect(productsLink.className).not.toContain(
      "text-[var(--color-muted-foreground)]",
    );  });

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
