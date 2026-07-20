import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ReportsDashboard } from "@/features/reports/reports-dashboard";
import type { AuthContextValue } from "@/providers/auth-provider";
import {
  getCustomerSummary,
  getExecutiveDashboard,
  getInventoryMovementsReport,
  getLowStockReport,
  getSalesOrdersReport,
  getSalesSummary,
} from "@/services/reports.service";
import { AdminApiError } from "@/types/api";

vi.mock("@/services/reports.service", () => ({
  getExecutiveDashboard: vi.fn(),
  getSalesSummary: vi.fn(),
  getCustomerSummary: vi.fn(),
  getLowStockReport: vi.fn(),
  getSalesOrdersReport: vi.fn(),
  getInventoryMovementsReport: vi.fn(),
}));

const useAuthMock = vi.fn<() => AuthContextValue>();

vi.mock("@/providers/auth-provider", () => ({
  useAuth: () => useAuthMock(),
}));

const storeId = "11111111-1111-1111-1111-111111111111";

const executive = {
  storeId,
  generatedAt: "2026-07-20T12:00:00.000Z",
  timezone: "UTC",
  filter: { storeId },
  executiveSummary: {
    grossRevenue: "100.00",
    netRevenue: "90.00",
    orders: 5,
    customers: 3,
    averageOrderValue: "18.00",
    inventoryValue: "250.00",
    lowStockCount: 1,
    purchaseOrderValue: "0.00",
    warehouseThroughput: 0,
    fulfillmentVolume: 2,
    returnRate: "0",
    collectionRate: "1",
    replenishmentAcceptanceRate: "0",
    currency: "USD",
  },
  sections: [],
};

const salesSummary = {
  storeId,
  generatedAt: "2026-07-20T12:00:00.000Z",
  timezone: "UTC",
  filter: { storeId },
  metrics: {
    grossSales: "100.00",
    discounts: "0.00",
    taxes: "0.00",
    shipping: "0.00",
    netSales: "90.00",
    averageOrderValue: "18.00",
    orderCount: 5,
    unitsSold: 8,
    currency: "USD",
  },
  byDay: [],
  byWeek: [],
  byMonth: [],
  byOrderStatus: [
    {
      status: "fulfilled",
      orderCount: 2,
      grossSales: "40.00",
      discounts: "0.00",
      taxes: "0.00",
      shipping: "0.00",
      netSales: "40.00",
      unitsSold: 2,
    },
    {
      status: "confirmed",
      orderCount: 3,
      grossSales: "60.00",
      discounts: "0.00",
      taxes: "0.00",
      shipping: "0.00",
      netSales: "50.00",
      unitsSold: 6,
    },
  ],
  byPaymentStatus: [],
  byStore: [],
  byWarehouse: [],
};

function authValue(): AuthContextValue {
  return {
    user: null,
    isAuthenticated: true,
    isLoading: false,
    error: null,
    storeId,
    storeName: "CommerceFlow Store",
    login: vi.fn(),
    logout: vi.fn(),
    clearError: vi.fn(),
  };
}

function renderReports() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <ReportsDashboard />
    </QueryClientProvider>,
  );
}

describe("ReportsDashboard", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders sales, inventory, and order sections from report APIs", async () => {
    useAuthMock.mockReturnValue(authValue());
    vi.mocked(getExecutiveDashboard).mockResolvedValue(executive);
    vi.mocked(getSalesSummary).mockResolvedValue(salesSummary);
    vi.mocked(getCustomerSummary).mockResolvedValue({
      storeId,
      generatedAt: "2026-07-20T12:00:00.000Z",
      timezone: "UTC",
      filter: { storeId },
      metrics: {
        totalCustomers: 3,
        activeCustomers: 3,
        newCustomers: 2,
        returningCustomers: 1,
        lifetimeValue: "90.00",
        averageOrderValue: "18.00",
        ordersPerCustomer: 1.6,
        revenuePerCustomer: "30.00",
        averagePurchaseIntervalDays: 0,
        currency: "USD",
      },
      newVsReturning: {
        newCustomers: 2,
        returningCustomers: 1,
        newCustomerRevenue: "40.00",
        returningCustomerRevenue: "50.00",
      },
      purchaseFrequency: [],
      geographicDistribution: [],
    });
    vi.mocked(getLowStockReport).mockResolvedValue({
      storeId,
      generatedAt: "2026-07-20T12:00:00.000Z",
      timezone: "UTC",
      filter: { storeId },
      lowStockItems: [
        {
          inventoryItemId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
          warehouseId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
          productVariantId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
          quantityOnHand: 2,
          quantityAvailable: 1,
          reorderPoint: 5,
          reorderQuantity: 10,
        },
      ],
      outOfStockItems: [],
      pagination: { page: 1, limit: 20, totalItems: 1, totalPages: 1 },
    });
    vi.mocked(getSalesOrdersReport).mockResolvedValue({
      storeId,
      generatedAt: "2026-07-20T12:00:00.000Z",
      timezone: "UTC",
      filter: { storeId },
      items: [
        {
          orderId: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
          orderNumber: "ORD-1001",
          storeId,
          orderStatus: "fulfilled",
          paymentStatus: "paid",
          currency: "USD",
          grossSales: "40.00",
          discounts: "0.00",
          taxes: "0.00",
          shipping: "0.00",
          netSales: "40.00",
          unitsSold: 2,
          createdAt: "2026-07-20T11:00:00.000Z",
        },
      ],
      pagination: { page: 1, limit: 10, totalItems: 1, totalPages: 1 },
    });
    vi.mocked(getInventoryMovementsReport).mockResolvedValue({
      storeId,
      generatedAt: "2026-07-20T12:00:00.000Z",
      timezone: "UTC",
      filter: { storeId },
      items: [
        {
          movementId: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
          inventoryItemId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
          warehouseId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
          productVariantId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
          movementType: "adjustment",
          quantity: -1,
          previousQuantityOnHand: 3,
          newQuantityOnHand: 2,
          createdAt: "2026-07-20T10:00:00.000Z",
        },
      ],
      pagination: { page: 1, limit: 10, totalItems: 1, totalPages: 1 },
      totals: {
        movementCount: 1,
        netQuantity: -1,
        quantityIn: 0,
        quantityOut: 1,
        adjustmentTotal: -1,
        byMovementType: {
          fulfillment: 0,
          adjustment: 1,
          return: 0,
          transfer: 0,
        },
      },
    });

    renderReports();

    expect(await screen.findByRole("heading", { name: "Reports" })).toBeInTheDocument();
    expect(await screen.findByText("Total Orders")).toBeInTheDocument();
    expect(screen.getAllByText("5").length).toBeGreaterThan(0);
    expect(screen.getByText("New Customers")).toBeInTheDocument();
    expect(screen.getByText("ORD-1001")).toBeInTheDocument();
    expect(screen.getByText("Orders by status")).toBeInTheDocument();
    expect(screen.getByText("Low stock")).toBeInTheDocument();
    expect(screen.getByText("Recent stock movements")).toBeInTheDocument();
  });

  it("supports date preset filters", async () => {
    const user = userEvent.setup();
    useAuthMock.mockReturnValue(authValue());
    vi.mocked(getExecutiveDashboard).mockResolvedValue(executive);
    vi.mocked(getSalesSummary).mockResolvedValue(salesSummary);
    vi.mocked(getCustomerSummary).mockResolvedValue({
      storeId,
      generatedAt: "2026-07-20T12:00:00.000Z",
      timezone: "UTC",
      filter: { storeId },
      metrics: {
        totalCustomers: 0,
        activeCustomers: 0,
        newCustomers: 0,
        returningCustomers: 0,
        lifetimeValue: "0.00",
        averageOrderValue: "0.00",
        ordersPerCustomer: 0,
        revenuePerCustomer: "0.00",
        averagePurchaseIntervalDays: 0,
        currency: "USD",
      },
      newVsReturning: {
        newCustomers: 0,
        returningCustomers: 0,
        newCustomerRevenue: "0.00",
        returningCustomerRevenue: "0.00",
      },
      purchaseFrequency: [],
      geographicDistribution: [],
    });
    vi.mocked(getLowStockReport).mockResolvedValue({
      storeId,
      generatedAt: "2026-07-20T12:00:00.000Z",
      timezone: "UTC",
      filter: { storeId },
      lowStockItems: [],
      outOfStockItems: [],
      pagination: { page: 1, limit: 20, totalItems: 0, totalPages: 0 },
    });
    vi.mocked(getSalesOrdersReport).mockResolvedValue({
      storeId,
      generatedAt: "2026-07-20T12:00:00.000Z",
      timezone: "UTC",
      filter: { storeId },
      items: [],
      pagination: { page: 1, limit: 10, totalItems: 0, totalPages: 0 },
    });
    vi.mocked(getInventoryMovementsReport).mockResolvedValue({
      storeId,
      generatedAt: "2026-07-20T12:00:00.000Z",
      timezone: "UTC",
      filter: { storeId },
      items: [],
      pagination: { page: 1, limit: 10, totalItems: 0, totalPages: 0 },
      totals: {
        movementCount: 0,
        netQuantity: 0,
        quantityIn: 0,
        quantityOut: 0,
        adjustmentTotal: 0,
        byMovementType: {
          fulfillment: 0,
          adjustment: 0,
          return: 0,
          transfer: 0,
        },
      },
    });

    renderReports();
    await screen.findByRole("heading", { name: "Reports" });

    await user.click(screen.getByRole("button", { name: "Last 7 days" }));

    await waitFor(() => {
      expect(getExecutiveDashboard).toHaveBeenCalledWith(
        expect.objectContaining({
          storeId,
          fromDate: expect.any(String),
          toDate: expect.any(String),
        }),
      );
    });
  });

  it("surfaces report load errors with retry", async () => {
    useAuthMock.mockReturnValue(authValue());
    vi.mocked(getExecutiveDashboard).mockRejectedValue(
      new AdminApiError("FORBIDDEN", "Forbidden", 403),
    );
    vi.mocked(getSalesSummary).mockRejectedValue(
      new AdminApiError("FORBIDDEN", "Forbidden", 403),
    );
    vi.mocked(getCustomerSummary).mockRejectedValue(
      new AdminApiError("FORBIDDEN", "Forbidden", 403),
    );
    vi.mocked(getLowStockReport).mockRejectedValue(
      new AdminApiError("FORBIDDEN", "Forbidden", 403),
    );
    vi.mocked(getSalesOrdersReport).mockRejectedValue(
      new AdminApiError("FORBIDDEN", "Forbidden", 403),
    );
    vi.mocked(getInventoryMovementsReport).mockRejectedValue(
      new AdminApiError("FORBIDDEN", "Forbidden", 403),
    );

    renderReports();

    expect(
      await screen.findByText("Unable to load sales overview"),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Forbidden").length).toBeGreaterThan(0);
  });
});
