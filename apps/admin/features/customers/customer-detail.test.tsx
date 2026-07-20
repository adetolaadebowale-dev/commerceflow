import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CustomerDetail } from "@/features/customers/customer-detail";
import type { AuthContextValue } from "@/providers/auth-provider";
import {
  getCustomer,
  listRecentOrdersForCustomerProfile,
  updateCustomer,
} from "@/services/customers.service";
import { AdminApiError } from "@/types/api";

vi.mock("@/services/customers.service", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/services/customers.service")>();
  return {
    ...actual,
    getCustomer: vi.fn(),
    listRecentOrdersForCustomerProfile: vi.fn(),
    updateCustomer: vi.fn(),
  };
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

const useAuthMock = vi.fn<() => AuthContextValue>();
const toastMock = vi.fn();

vi.mock("@/providers/auth-provider", () => ({
  useAuth: () => useAuthMock(),
}));

vi.mock("@/providers/toast-provider", () => ({
  useToast: () => ({ toast: toastMock }),
}));

const storeId = "11111111-1111-1111-1111-111111111111";
const customerId = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";

const sampleCustomer = {
  id: customerId,
  storeId,
  email: "jane@example.com",
  firstName: "Jane",
  lastName: "Doe",
  phone: "+15551212",
  status: "active" as const,
  createdAt: "2026-07-20T09:00:00.000Z",
  updatedAt: "2026-07-20T10:00:00.000Z",
};

const sampleOrder = {
  id: "oooooooo-oooo-4ooo-8ooo-oooooooooooo",
  storeId,
  orderNumber: "ORD-1",
  status: "confirmed" as const,
  currency: "USD",
  subtotal: "40.00",
  total: "40.00",
  customerProfileId: customerId,
  items: [],
  createdAt: "2026-07-20T11:00:00.000Z",
  updatedAt: "2026-07-20T11:00:00.000Z",
};

function renderDetail() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <CustomerDetail customerId={customerId} />
    </QueryClientProvider>,
  );
}

describe("CustomerDetail", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders customer information and recent orders", async () => {
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

    vi.mocked(getCustomer).mockResolvedValue(sampleCustomer);
    vi.mocked(listRecentOrdersForCustomerProfile).mockResolvedValue([
      sampleOrder,
    ]);

    renderDetail();

    expect(await screen.findByRole("heading", { name: "Jane Doe" })).toBeInTheDocument();
    expect(screen.getAllByText("jane@example.com").length).toBeGreaterThan(0);
    expect(await screen.findByText("ORD-1")).toBeInTheDocument();
    expect(screen.getByText("Customer Information")).toBeInTheDocument();
    expect(screen.getByText("Order Summary")).toBeInTheDocument();
  });

  it("deactivates a customer", async () => {
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

    vi.mocked(getCustomer).mockResolvedValue(sampleCustomer);
    vi.mocked(listRecentOrdersForCustomerProfile).mockResolvedValue([]);
    vi.mocked(updateCustomer).mockResolvedValue({
      ...sampleCustomer,
      status: "inactive",
    });

    renderDetail();

    await screen.findByRole("heading", { name: "Jane Doe" });
    await user.click(screen.getByRole("button", { name: "Deactivate" }));

    await waitFor(() => {
      expect(updateCustomer).toHaveBeenCalledWith(
        customerId,
        { status: "inactive" },
        { storeId },
      );
    });
    expect(toastMock).toHaveBeenCalledWith("Customer deactivated");
  });

  it("surfaces load errors", async () => {
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

    vi.mocked(getCustomer).mockRejectedValue(
      new AdminApiError("NOT_FOUND", "Not found", 404),
    );

    renderDetail();

    expect(await screen.findByText("Unable to load customer")).toBeInTheDocument();
    expect(screen.getByText("Not found")).toBeInTheDocument();
  });
});
