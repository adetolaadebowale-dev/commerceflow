import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { WarehouseList } from "@/features/warehouses/warehouse-list";
import type { AuthContextValue } from "@/providers/auth-provider";
import {
  createWarehouse,
  deleteWarehouse,
  listWarehouses,
  updateWarehouse,
} from "@/services/warehouses.service";
import { AdminApiError } from "@/types/api";

vi.mock("@/services/warehouses.service", () => ({
  listWarehouses: vi.fn(),
  createWarehouse: vi.fn(),
  updateWarehouse: vi.fn(),
  deleteWarehouse: vi.fn(),
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

const sampleWarehouse = {
  id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  storeId,
  name: "Main Warehouse",
  code: "MAIN",
  address: "100 Market St",
  city: "Austin",
  stateProvince: "TX",
  postalCode: "78701",
  countryCode: "US",
  status: "active" as const,
  isDefault: true,
  createdAt: "2026-07-20T10:00:00.000Z",
  updatedAt: "2026-07-20T10:00:00.000Z",
};

const secondaryWarehouse = {
  ...sampleWarehouse,
  id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  name: "East Depot",
  code: "EAST",
  isDefault: false,
};

function renderList() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={client}>
      <WarehouseList />
    </QueryClientProvider>,
  );
}

describe("WarehouseList", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders warehouses from the API", async () => {
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

    vi.mocked(listWarehouses).mockResolvedValue({
      items: [sampleWarehouse, secondaryWarehouse],
      total: 2,
      page: 1,
      limit: 20,
      totalPages: 1,
    });

    renderList();

    expect(await screen.findByText("Main Warehouse")).toBeInTheDocument();
    expect(screen.getByText("East Depot")).toBeInTheDocument();
    expect(screen.getByText("2 warehouses")).toBeInTheDocument();
  });

  it("shows empty state when there are no warehouses", async () => {
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

    vi.mocked(listWarehouses).mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 0,
    });

    renderList();

    expect(await screen.findByText("No warehouses found")).toBeInTheDocument();
  });

  it("shows error state and retries", async () => {
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

    vi.mocked(listWarehouses)
      .mockRejectedValueOnce(
        new AdminApiError("WAREHOUSE_NOT_FOUND", "Store warehouses unavailable", 404),
      )
      .mockResolvedValueOnce({
        items: [sampleWarehouse],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });

    renderList();

    expect(
      await screen.findByText("Unable to load warehouses"),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Retry" }));
    expect(await screen.findByText("Main Warehouse")).toBeInTheDocument();
  });

  it("opens create dialog and submits a new warehouse", async () => {
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

    vi.mocked(listWarehouses).mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 0,
    });
    vi.mocked(createWarehouse).mockResolvedValue(sampleWarehouse);

    renderList();

    await user.click(
      await screen.findByRole("button", { name: "Add Warehouse" }),
    );
    expect(
      await screen.findByRole("heading", { name: "Create warehouse" }),
    ).toBeInTheDocument();

    await user.type(screen.getByLabelText("Name"), "Main Warehouse");
    await user.type(screen.getByLabelText("Code"), "main");
    await user.type(screen.getByLabelText("Address"), "100 Market St");
    await user.type(screen.getByLabelText("City"), "Austin");
    await user.type(screen.getByLabelText("State / Province"), "TX");
    await user.type(screen.getByLabelText("Postal code"), "78701");

    await user.click(
      screen.getByRole("button", { name: "Create warehouse" }),
    );

    await waitFor(() => {
      expect(createWarehouse).toHaveBeenCalledWith(
        expect.objectContaining({
          storeId,
          name: "Main Warehouse",
          code: "MAIN",
          address: "100 Market St",
          city: "Austin",
          stateProvince: "TX",
          postalCode: "78701",
          countryCode: "US",
          status: "active",
        }),
      );
    });
    expect(toastMock).toHaveBeenCalledWith("Main Warehouse created");
  });

  it("confirms delete for non-default warehouses", async () => {
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

    vi.mocked(listWarehouses).mockResolvedValue({
      items: [sampleWarehouse, secondaryWarehouse],
      total: 2,
      page: 1,
      limit: 20,
      totalPages: 1,
    });
    vi.mocked(deleteWarehouse).mockResolvedValue(secondaryWarehouse);

    renderList();

    await screen.findByText("East Depot");

    const deleteButtons = screen.getAllByRole("button", { name: "Delete" });
    expect(deleteButtons[0]).toBeDisabled();
    await user.click(deleteButtons[1]!);

    const dialog = await screen.findByRole("dialog");
    expect(
      within(dialog).getByRole("heading", { name: "Delete warehouse" }),
    ).toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: "Delete" }));
    await waitFor(() => {
      expect(deleteWarehouse).toHaveBeenCalledWith(secondaryWarehouse.id, {
        storeId,
      });
    });
    expect(toastMock).toHaveBeenCalledWith("East Depot deleted");
  });

  it("surfaces backend delete errors", async () => {
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

    vi.mocked(listWarehouses).mockResolvedValue({
      items: [secondaryWarehouse],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    });
    vi.mocked(deleteWarehouse).mockRejectedValue(
      new AdminApiError(
        "WAREHOUSE_CANNOT_DELETE_DEFAULT",
        "Cannot delete the default warehouse",
        409,
      ),
    );

    renderList();
    await screen.findByText("East Depot");
    await user.click(screen.getByRole("button", { name: "Delete" }));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Delete" }));

    await waitFor(() => {
      expect(toastMock).toHaveBeenCalledWith(
        "Cannot delete the default warehouse",
        "error",
      );
    });
  });
});

describe("WarehouseList edit", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("opens edit dialog for an existing warehouse", async () => {
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

    vi.mocked(listWarehouses).mockResolvedValue({
      items: [secondaryWarehouse],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    });
    vi.mocked(updateWarehouse).mockResolvedValue({
      ...secondaryWarehouse,
      name: "East Hub",
    });

    renderList();
    await screen.findByText("East Depot");
    await user.click(screen.getByRole("button", { name: "Edit" }));

    expect(
      await screen.findByRole("heading", { name: "Edit warehouse" }),
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue("East Depot")).toBeInTheDocument();
  });
});
