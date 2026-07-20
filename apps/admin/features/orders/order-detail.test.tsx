import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { OrderDetail } from "@/features/orders/order-detail";
import type { AuthContextValue } from "@/providers/auth-provider";
import {
  confirmOrder,
  getCustomer,
  getOrder,
  listOrderReservations,
} from "@/services/orders.service";

vi.mock("@/services/orders.service", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services/orders.service")>();
  return {
    ...actual,
    getOrder: vi.fn(),
    getCustomer: vi.fn(),
    listOrderReservations: vi.fn(),
    confirmOrder: vi.fn(),
    cancelOrder: vi.fn(),
    reserveOrder: vi.fn(),
    fulfillOrder: vi.fn(),
  };
});

const toastMock = vi.fn();

vi.mock("@/providers/toast-provider", () => ({
  useToast: () => ({ toast: toastMock }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

const useAuthMock = vi.fn<() => AuthContextValue>();

vi.mock("@/providers/auth-provider", () => ({
  useAuth: () => useAuthMock(),
}));

const storeId = "11111111-1111-1111-1111-111111111111";
const orderId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const customerId = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";

function renderDetail() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={client}>
      <OrderDetail orderId={orderId} />
    </QueryClientProvider>,
  );
}

describe("OrderDetail", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders summary, items, timeline, and confirm action", async () => {
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

    vi.mocked(getOrder).mockResolvedValue({
      id: orderId,
      storeId,
      customerId,
      orderNumber: "ORD-1001",
      status: "draft",
      subtotal: "50.00",
      taxAmount: "5.00",
      total: "55.00",
      currency: "USD",
      items: [
        {
          id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
          orderId,
          productVariantId: "ffffffff-ffff-4fff-8fff-ffffffffffff",
          productName: "Classic Tee",
          sku: "TEE-M",
          unitPrice: "25.00",
          currency: "USD",
          quantity: 2,
          lineSubtotal: "50.00",
          createdAt: "2026-07-20T10:00:00.000Z",
        },
      ],
      createdAt: "2026-07-20T10:00:00.000Z",
      updatedAt: "2026-07-20T10:00:00.000Z",
    });
    vi.mocked(getCustomer).mockResolvedValue({
      id: customerId,
      storeId,
      email: "jane@example.com",
      firstName: "Jane",
      lastName: "Doe",
      status: "active",
      createdAt: "2026-07-20T09:00:00.000Z",
      updatedAt: "2026-07-20T09:00:00.000Z",
    });
    vi.mocked(listOrderReservations).mockResolvedValue([]);
    vi.mocked(confirmOrder).mockResolvedValue({
      id: orderId,
      storeId,
      customerId,
      orderNumber: "ORD-1001",
      status: "confirmed",
      subtotal: "50.00",
      taxAmount: "5.00",
      total: "55.00",
      currency: "USD",
      items: [],
      confirmedAt: "2026-07-20T11:00:00.000Z",
      createdAt: "2026-07-20T10:00:00.000Z",
      updatedAt: "2026-07-20T11:00:00.000Z",
    });

    renderDetail();

    expect(await screen.findByRole("heading", { name: "ORD-1001" })).toBeInTheDocument();
    expect(screen.getByText("Classic Tee")).toBeInTheDocument();
    expect(await screen.findByText("Jane Doe")).toBeInTheDocument();
    expect(screen.getByText("Created")).toBeInTheDocument();
    expect(screen.getByText("No reservations for this order.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Confirm Order" }));
    await waitFor(() => {
      expect(confirmOrder).toHaveBeenCalledWith(orderId, { storeId });
    });
    expect(toastMock).toHaveBeenCalledWith("Order confirmed");
  });
});
