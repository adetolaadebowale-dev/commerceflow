import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { OrderList } from "@/features/orders/order-list";
import type { AuthContextValue } from "@/providers/auth-provider";
import { listCustomers, listOrders } from "@/services/orders.service";
import { AdminApiError } from "@/types/api";

vi.mock("@/services/orders.service", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services/orders.service")>();
  return {
    ...actual,
    listOrders: vi.fn(),
    listCustomers: vi.fn(),
  };
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

const useAuthMock = vi.fn<() => AuthContextValue>();

vi.mock("@/providers/auth-provider", () => ({
  useAuth: () => useAuthMock(),
}));

const storeId = "11111111-1111-1111-1111-111111111111";

function renderList() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <OrderList />
    </QueryClientProvider>,
  );
}

describe("OrderList", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders orders from the API", async () => {
    useAuthMock.mockReturnValue({
      user: null,
      isAuthenticated: true,
      isLoading: false,
      error: null,
      storeId,
      storeName: "CommerceFlow Store",
      login: vi.fn(),
      logout: vi.fn(),
      clearError: vi.fn(),
    });

    vi.mocked(listCustomers).mockResolvedValue({
      items: [
        {
          id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
          storeId,
          email: "jane@example.com",
          firstName: "Jane",
          lastName: "Doe",
          status: "active",
          createdAt: "2026-07-20T09:00:00.000Z",
          updatedAt: "2026-07-20T09:00:00.000Z",
        },
      ],
      total: 1,
      page: 1,
      limit: 100,
      totalPages: 1,
    });

    vi.mocked(listOrders).mockResolvedValue({
      items: [
        {
          id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
          storeId,
          customerId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
          orderNumber: "ORD-1001",
          status: "confirmed",
          subtotal: "42.00",
          total: "42.00",
          currency: "USD",
          items: [],
          createdAt: "2026-07-20T10:00:00.000Z",
          updatedAt: "2026-07-20T10:00:00.000Z",
        },
      ],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    });

    renderList();

    expect(await screen.findByText("ORD-1001")).toBeInTheDocument();
    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    expect(screen.getByText("1 order")).toBeInTheDocument();
  });

  it("shows empty and error states", async () => {
    const user = userEvent.setup();
    useAuthMock.mockReturnValue({
      user: null,
      isAuthenticated: true,
      isLoading: false,
      error: null,
      storeId,
      storeName: "CommerceFlow Store",
      login: vi.fn(),
      logout: vi.fn(),
      clearError: vi.fn(),
    });

    vi.mocked(listCustomers).mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      limit: 100,
      totalPages: 0,
    });
    vi.mocked(listOrders)
      .mockRejectedValueOnce(
        new AdminApiError("ORDER_NOT_FOUND", "Orders unavailable", 404),
      )
      .mockResolvedValueOnce({
        items: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
      });

    renderList();
    expect(await screen.findByText("Unable to load orders")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Retry" }));
    expect(await screen.findByText("No orders found")).toBeInTheDocument();
  });
});
