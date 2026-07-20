import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CreateProductForm } from "@/features/products/create-product-form";
import type { AuthContextValue } from "@/providers/auth-provider";
import {
  createProduct,
  listBrands,
  listCategories,
} from "@/services/products.service";

vi.mock("@/services/products.service", () => ({
  createProduct: vi.fn(),
  listBrands: vi.fn(),
  listCategories: vi.fn(),
}));

const pushMock = vi.fn();
const toastMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

vi.mock("@/providers/toast-provider", () => ({
  useToast: () => ({ toast: toastMock }),
}));

const useAuthMock = vi.fn<() => AuthContextValue>();

vi.mock("@/providers/auth-provider", () => ({
  useAuth: () => useAuthMock(),
}));

function renderForm() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={client}>
      <CreateProductForm />
    </QueryClientProvider>,
  );
}

function setNativeSelect(label: string, value: string) {
  const trigger = screen.getByLabelText(label);
  const native = trigger.parentElement?.querySelector("select");
  if (!native) {
    throw new Error(`Native select for ${label} not found`);
  }
  fireEvent.change(native, { target: { value } });
}

describe("CreateProductForm", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("submits a product and navigates to the product detail page", async () => {
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
          id: "22222222-2222-4222-8222-222222222201",
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
          id: "22222222-2222-4222-8222-222222222202",
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
    vi.mocked(createProduct).mockResolvedValue({
      id: "product-new",
      storeId: "11111111-1111-1111-1111-111111111111",
      name: "Summer Tee",
      slug: "summer-tee",
      status: "draft",
      categoryId: "22222222-2222-4222-8222-222222222202",
      brandId: "22222222-2222-4222-8222-222222222201",
      variants: [],
      createdAt: "2026-07-19T12:00:00.000Z",
      updatedAt: "2026-07-19T12:00:00.000Z",
    });

    const user = userEvent.setup();
    renderForm();

    await waitFor(() => {
      expect(screen.getByLabelText("Product Name")).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText("Product Name"), "Summer Tee");
    setNativeSelect("Category", "22222222-2222-4222-8222-222222222202");
    setNativeSelect("Brand", "22222222-2222-4222-8222-222222222201");
    await user.click(screen.getByRole("button", { name: "Create Product" }));

    await waitFor(() => {
      expect(createProduct).toHaveBeenCalled();
    });

    expect(vi.mocked(createProduct).mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({
        storeId: "11111111-1111-1111-1111-111111111111",
        name: "Summer Tee",
        slug: "summer-tee",
        status: "draft",
        categoryId: "22222222-2222-4222-8222-222222222202",
        brandId: "22222222-2222-4222-8222-222222222201",
        variants: [
          expect.objectContaining({
            sku: "SUMMER-TEE-DEFAULT",
            name: "Default",
            price: "0.00",
            currency: "USD",
          }),
        ],
      }),
    );
    expect(toastMock).toHaveBeenCalledWith(
      "Product created successfully. Continue by uploading images or editing product details.",
    );
    expect(pushMock).toHaveBeenCalledWith("/dashboard/products/product-new");
  });
});
