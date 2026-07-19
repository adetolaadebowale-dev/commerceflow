import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DashboardHome } from "@/features/dashboard/dashboard-home";
import type { AuthContextValue } from "@/providers/auth-provider";
import {
  fetchDashboardKpis,
  fetchDashboardLowStock,
  fetchDashboardRecentActivity,
  fetchDashboardRecentOrders,
} from "@/services/dashboard.service";
import { AdminApiError } from "@/types/api";
import type {
  DashboardActivityRow,
  DashboardKpi,
  DashboardLowStockRow,
  DashboardOrderRow,
} from "@/types/dashboard";

vi.mock("@/services/dashboard.service", () => ({
  fetchDashboardKpis: vi.fn(),
  fetchDashboardRecentOrders: vi.fn(),
  fetchDashboardLowStock: vi.fn(),
  fetchDashboardRecentActivity: vi.fn(),
}));

const useAuthMock = vi.fn<() => AuthContextValue>();

vi.mock("@/providers/auth-provider", () => ({
  useAuth: () => useAuthMock(),
}));

const kpis: readonly DashboardKpi[] = [
  { key: "products", label: "Total Products", value: "12" },
  { key: "orders", label: "Total Orders", value: "34" },
  { key: "customers", label: "Total Customers", value: "56" },
  { key: "inventory", label: "Inventory Value", value: "$1,000.00" },
];

const recentOrders: readonly DashboardOrderRow[] = [
  {
    id: "order-1",
    orderNumber: "ORD-001",
    customer: "Ada Lovelace",
    status: "confirmed",
    total: "$42.00",
    date: "Jul 18, 2026, 10:00 AM",
  },
];

const lowStock: readonly DashboardLowStockRow[] = [
  {
    id: "inv-1",
    product: "Classic Tee",
    sku: "TEE-001",
    remainingQuantity: 2,
  },
];

const recentActivity: readonly DashboardActivityRow[] = [
  {
    id: "audit-1",
    action: "order create",
    user: "User 11111111",
    time: "Jul 18, 2026, 10:05 AM",
  },
];

function renderDashboard() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={client}>
      <DashboardHome />
    </QueryClientProvider>,
  );
}

function mockAuthenticatedStore() {
  useAuthMock.mockReturnValue({
    user: null,
    isAuthenticated: true,
    isLoading: false,
    error: null,
    storeId: "11111111-1111-1111-1111-111111111111",
    storeName: "CommerceFlow Store",
    login: vi.fn(),
    logout: vi.fn(),
    clearError: vi.fn(),
  });
}

describe("DashboardHome", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("shows a configuration error when store id is missing", () => {
    useAuthMock.mockReturnValue({
      user: null,
      isAuthenticated: true,
      isLoading: false,
      error: null,
      storeId: null,
      storeName: "CommerceFlow Store",
      login: vi.fn(),
      logout: vi.fn(),
      clearError: vi.fn(),
    });

    renderDashboard();

    expect(screen.getByText("Store not configured")).toBeInTheDocument();
  });

  it("renders KPIs, recent orders, low stock, activity, and quick actions", async () => {
    mockAuthenticatedStore();
    vi.mocked(fetchDashboardKpis).mockResolvedValue(kpis);
    vi.mocked(fetchDashboardRecentOrders).mockResolvedValue(recentOrders);
    vi.mocked(fetchDashboardLowStock).mockResolvedValue(lowStock);
    vi.mocked(fetchDashboardRecentActivity).mockResolvedValue(recentActivity);

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText("Total Products")).toBeInTheDocument();
    });

    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("ORD-001")).toBeInTheDocument();
    expect(screen.getByText("Classic Tee")).toBeInTheDocument();
    expect(screen.getByText("order create")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Add Product/i }),
    ).toBeInTheDocument();
  });

  it("renders empty states when lists are empty", async () => {
    mockAuthenticatedStore();
    vi.mocked(fetchDashboardKpis).mockResolvedValue(kpis);
    vi.mocked(fetchDashboardRecentOrders).mockResolvedValue([]);
    vi.mocked(fetchDashboardLowStock).mockResolvedValue([]);
    vi.mocked(fetchDashboardRecentActivity).mockResolvedValue([]);

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText("No recent orders")).toBeInTheDocument();
    });
    expect(screen.getByText("No low stock items")).toBeInTheDocument();
    expect(screen.getByText("No recent activity")).toBeInTheDocument();
  });

  it("keeps other widgets rendering when low stock fails", async () => {
    mockAuthenticatedStore();
    vi.mocked(fetchDashboardKpis).mockResolvedValue(kpis);
    vi.mocked(fetchDashboardRecentOrders).mockResolvedValue(recentOrders);
    vi.mocked(fetchDashboardLowStock).mockRejectedValue(
      new AdminApiError("NOT_FOUND", "Low stock unavailable", 404),
    );
    vi.mocked(fetchDashboardRecentActivity).mockResolvedValue(recentActivity);

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText("Total Products")).toBeInTheDocument();
    });

    expect(screen.getByText("ORD-001")).toBeInTheDocument();
    expect(screen.getByText("order create")).toBeInTheDocument();
    expect(screen.getByText("Unable to load low stock")).toBeInTheDocument();
    expect(screen.getByText("Low stock unavailable")).toBeInTheDocument();
  });
});
