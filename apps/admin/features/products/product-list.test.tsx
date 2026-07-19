import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ProductList } from "@/features/products/product-list";
import type { AuthContextValue } from "@/providers/auth-provider";
import {
  listBrands,
  listCategories,
  listProducts,
} from "@/services/products.service";
import { AdminApiError } from "@/types/api";

vi.mock("@/services/products.service", () => ({
  listProducts: vi.fn(),
  listBrands: vi.fn(),
  listCategories: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

const useAuthMock = vi.fn<() => AuthContextValue>();

vi.mock("@/providers/auth-provider", () => ({
  useAuth: () => useAuthMock(),
}));

function renderList() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={client}>
      <ProductList />
    </QueryClientProvider>,
  );
}

describe("ProductList", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders products from the catalogue API", async () => {
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

    vi.mocked(listBrands).mockResolvedValue({
      items: [
        {
          id: "brand-1",
          storeId: "11111111-1111-1111-1111-111111111111",
          name: "Northwind Apparel",
          slug: "northwind-apparel",
          createdAt: "2026-07-18T10:00:00.000Z",
          updatedAt: "2026-07-18T10:00:00.000Z",
        },
      ],
      total: 1,
      page: 1,
      limit: 100,
      totalPages: 1,
    });
    vi.mocked(listCategories).mockResolvedValue({
      items: [
        {
          id: "category-1",
          storeId: "11111111-1111-1111-1111-111111111111",
          name: "T-Shirts",
          slug: "t-shirts",
          createdAt: "2026-07-18T10:00:00.000Z",
          updatedAt: "2026-07-18T10:00:00.000Z",
        },
      ],
      total: 1,
      page: 1,
      limit: 100,
      totalPages: 1,
    });
    vi.mocked(listProducts).mockResolvedValue({
      items: [
        {
          id: "product-1",
          storeId: "11111111-1111-1111-1111-111111111111",
          name: "Classic Tee",
          slug: "classic-tee",
          status: "active",
          categoryId: "category-1",
          brandId: "brand-1",
          variants: [
            {
              id: "variant-1",
              productId: "product-1",
              sku: "TEE-001",
              name: "Default",
              price: "29.00",
              currency: "USD",
              createdAt: "2026-07-18T10:00:00.000Z",
              updatedAt: "2026-07-18T10:00:00.000Z",
            },
          ],
          createdAt: "2026-07-18T10:00:00.000Z",
          updatedAt: "2026-07-18T12:00:00.000Z",
        },
      ],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    });

    renderList();

    await waitFor(() => {
      expect(screen.getByText("Classic Tee")).toBeInTheDocument();
    });

    expect(screen.getByText("1 product")).toBeInTheDocument();
    expect(screen.getByText("Northwind Apparel")).toBeInTheDocument();
    expect(screen.getByText("T-Shirts")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add Product" })).toBeDisabled();
  });

  it("shows an error state with retry", async () => {
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
    vi.mocked(listBrands).mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      limit: 100,
      totalPages: 0,
    });
    vi.mocked(listCategories).mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      limit: 100,
      totalPages: 0,
    });
    vi.mocked(listProducts).mockRejectedValue(
      new AdminApiError("FORBIDDEN", "Not allowed", 403),
    );

    renderList();

    await waitFor(() => {
      expect(screen.getByText("Unable to load products")).toBeInTheDocument();
    });

    const retry = screen.getByRole("button", { name: "Retry" });
    await userEvent.click(retry);
    expect(listProducts).toHaveBeenCalledTimes(2);
  });
});
