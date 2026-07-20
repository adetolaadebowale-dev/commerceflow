import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ProductDetail } from "@/features/products/product-detail";
import type { AuthContextValue } from "@/providers/auth-provider";
import {
  getProduct,
  listBrands,
  listCategories,
  listProductMedia,
  listProductVariants,
  updateProduct,
} from "@/services/products.service";

vi.mock("@/services/products.service", () => ({
  getProduct: vi.fn(),
  listBrands: vi.fn(),
  listCategories: vi.fn(),
  listProductMedia: vi.fn(),
  listProductVariants: vi.fn(),
  updateProduct: vi.fn(),
  uploadProductMedia: vi.fn(),
  deleteProductMedia: vi.fn(),
  reorderProductMedia: vi.fn(),
  createProductVariant: vi.fn(),
  updateProductVariant: vi.fn(),
  deleteProductVariant: vi.fn(),
}));

vi.mock("@/services/inventory.service", () => ({
  listInventoryItems: vi.fn().mockResolvedValue({
    items: [],
    total: 0,
    page: 1,
    limit: 100,
    totalPages: 0,
  }),
  getInventorySummary: vi.fn().mockResolvedValue({
    byProductVariant: [],
    lowStockItems: [],
    outOfStockItems: [],
  }),
  createInventoryAdjustment: vi.fn(),
  listInventoryAdjustments: vi.fn().mockResolvedValue({
    items: [],
    total: 0,
    page: 1,
    limit: 100,
    totalPages: 0,
  }),
  listInventoryItemStockMovements: vi.fn().mockResolvedValue({
    items: [],
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  }),
}));

const toastMock = vi.fn();
const pushMock = vi.fn();

vi.mock("@/providers/toast-provider", () => ({
  useToast: () => ({ toast: toastMock }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

const useAuthMock = vi.fn<() => AuthContextValue>();

vi.mock("@/providers/auth-provider", () => ({
  useAuth: () => useAuthMock(),
}));

function renderDetail() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={client}>
      <ProductDetail productId="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" />
    </QueryClientProvider>,
  );
}

describe("ProductDetail", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders editable product information and media gallery", async () => {
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

    vi.mocked(getProduct).mockResolvedValue({
      id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      storeId: "11111111-1111-1111-1111-111111111111",
      name: "Classic Tee",
      slug: "classic-tee",
      description: "Soft cotton tee",
      status: "active",
      categoryId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
      brandId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      variants: [],
      createdAt: "2026-07-19T12:00:00.000Z",
      updatedAt: "2026-07-19T12:00:00.000Z",
    });
    vi.mocked(listBrands).mockResolvedValue({
      items: [
        {
          id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
          storeId: "11111111-1111-1111-1111-111111111111",
          name: "Acme",
          slug: "acme",
          createdAt: "2026-07-19T12:00:00.000Z",
          updatedAt: "2026-07-19T12:00:00.000Z",
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
          id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
          storeId: "11111111-1111-1111-1111-111111111111",
          name: "Apparel",
          slug: "apparel",
          createdAt: "2026-07-19T12:00:00.000Z",
          updatedAt: "2026-07-19T12:00:00.000Z",
        },
      ],
      total: 1,
      page: 1,
      limit: 100,
      totalPages: 1,
    });
    vi.mocked(listProductMedia).mockResolvedValue({ items: [] });
    vi.mocked(listProductVariants).mockResolvedValue({ items: [] });

    renderDetail();

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Classic Tee" })).toBeInTheDocument();
    });

    expect(screen.getByText("Product Information")).toBeInTheDocument();
    expect(screen.getByText("Media Gallery")).toBeInTheDocument();
    expect(screen.getByText("Variants")).toBeInTheDocument();
    expect(screen.getByText("Inventory")).toBeInTheDocument();
    expect(screen.getByLabelText("Product Name")).toHaveValue("Classic Tee");
    expect(screen.getByLabelText("Slug")).toHaveValue("classic-tee");
    expect(screen.getByRole("button", { name: "Save changes" })).toBeDisabled();
    expect(screen.getByText("No media yet")).toBeInTheDocument();
    expect(screen.getByText("No variants yet")).toBeInTheDocument();
  });

  it("saves product edits via updateProduct", async () => {
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

    const product = {
      id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      storeId: "11111111-1111-1111-1111-111111111111",
      name: "Classic Tee",
      slug: "classic-tee",
      description: "Soft cotton tee",
      status: "draft" as const,
      categoryId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
      brandId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      variants: [],
      createdAt: "2026-07-19T12:00:00.000Z",
      updatedAt: "2026-07-19T12:00:00.000Z",
    };

    vi.mocked(getProduct).mockResolvedValue(product);
    vi.mocked(listBrands).mockResolvedValue({
      items: [
        {
          id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
          storeId: "11111111-1111-1111-1111-111111111111",
          name: "Acme",
          slug: "acme",
          createdAt: "2026-07-19T12:00:00.000Z",
          updatedAt: "2026-07-19T12:00:00.000Z",
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
          id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
          storeId: "11111111-1111-1111-1111-111111111111",
          name: "Apparel",
          slug: "apparel",
          createdAt: "2026-07-19T12:00:00.000Z",
          updatedAt: "2026-07-19T12:00:00.000Z",
        },
      ],
      total: 1,
      page: 1,
      limit: 100,
      totalPages: 1,
    });
    vi.mocked(listProductMedia).mockResolvedValue({ items: [] });
    vi.mocked(listProductVariants).mockResolvedValue({ items: [] });
    vi.mocked(updateProduct).mockResolvedValue({
      ...product,
      name: "Classic Tee Updated",
      updatedAt: "2026-07-20T12:00:00.000Z",
    });

    const user = userEvent.setup();
    renderDetail();

    await waitFor(() => {
      expect(screen.getByLabelText("Product Name")).toBeInTheDocument();
    });

    const nameInput = screen.getByLabelText("Product Name");
    await user.clear(nameInput);
    await user.type(nameInput, "Classic Tee Updated");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => {
      expect(updateProduct).toHaveBeenCalled();
    });

    expect(vi.mocked(updateProduct).mock.calls[0]?.[0]).toBe(
      "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    );
    expect(vi.mocked(updateProduct).mock.calls[0]?.[1]).toEqual(
      expect.objectContaining({
        name: "Classic Tee Updated",
        slug: "classic-tee",
        categoryId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
      }),
    );
    expect(toastMock).toHaveBeenCalledWith("Product saved successfully");
  });
});
