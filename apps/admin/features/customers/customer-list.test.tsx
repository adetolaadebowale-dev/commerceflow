import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CustomerList } from "@/features/customers/customer-list";
import type { AuthContextValue } from "@/providers/auth-provider";
import {
  createCustomer,
  listCustomers,
  updateCustomer,
} from "@/services/customers.service";
import { AdminApiError } from "@/types/api";

vi.mock("@/services/customers.service", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/services/customers.service")>();
  return {
    ...actual,
    listCustomers: vi.fn(),
    createCustomer: vi.fn(),
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

const sampleCustomer = {
  id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  storeId,
  email: "jane@example.com",
  firstName: "Jane",
  lastName: "Doe",
  phone: "+15551212",
  status: "active" as const,
  createdAt: "2026-07-20T09:00:00.000Z",
  updatedAt: "2026-07-20T09:00:00.000Z",
};

function renderList() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <CustomerList />
    </QueryClientProvider>,
  );
}

describe("CustomerList", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders customers from the API", async () => {
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
      items: [sampleCustomer],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    });

    renderList();

    expect(await screen.findByText("Jane Doe")).toBeInTheDocument();
    expect(screen.getByText("jane@example.com")).toBeInTheDocument();
    expect(screen.getByText("+15551212")).toBeInTheDocument();
  });

  it("shows an empty state when there are no customers", async () => {
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
      limit: 20,
      totalPages: 0,
    });

    renderList();

    expect(await screen.findByText("No customers found")).toBeInTheDocument();
  });

  it("shows an error state with retry", async () => {
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

    vi.mocked(listCustomers).mockRejectedValue(
      new AdminApiError("FORBIDDEN", "Forbidden", 403),
    );

    renderList();

    expect(await screen.findByText("Unable to load customers")).toBeInTheDocument();
    expect(screen.getByText("Forbidden")).toBeInTheDocument();
  });

  it("creates a customer from the dialog", async () => {
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
      limit: 20,
      totalPages: 0,
    });
    vi.mocked(createCustomer).mockResolvedValue({
      ...sampleCustomer,
      firstName: "Alex",
      lastName: "Rivera",
      email: "alex@example.com",
      phone: undefined,
    });

    renderList();

    await screen.findByText("No customers found");
    await user.click(screen.getAllByRole("button", { name: "Add Customer" })[0]!);

    await user.type(screen.getByLabelText("First name"), "Alex");
    await user.type(screen.getByLabelText("Last name"), "Rivera");
    await user.type(screen.getByLabelText("Email"), "alex@example.com");
    await user.click(screen.getByRole("button", { name: "Create customer" }));

    await waitFor(() => {
      expect(createCustomer).toHaveBeenCalledWith({
        storeId,
        firstName: "Alex",
        lastName: "Rivera",
        email: "alex@example.com",
        phone: undefined,
        status: "active",
      });
    });
    expect(toastMock).toHaveBeenCalledWith("Customer created");
  });

  it("updates a customer from the edit dialog", async () => {
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
      items: [sampleCustomer],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    });
    vi.mocked(updateCustomer).mockResolvedValue({
      ...sampleCustomer,
      firstName: "Janet",
    });

    renderList();

    await screen.findByText("Jane Doe");
    await user.click(screen.getByRole("button", { name: "Edit" }));

    const firstName = screen.getByLabelText("First name");
    await user.clear(firstName);
    await user.type(firstName, "Janet");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => {
      expect(updateCustomer).toHaveBeenCalledWith(
        sampleCustomer.id,
        expect.objectContaining({
          firstName: "Janet",
          lastName: "Doe",
          email: "jane@example.com",
          status: "active",
        }),
        { storeId },
      );
    });
    expect(toastMock).toHaveBeenCalledWith("Customer updated");
  });
});
