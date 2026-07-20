import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CategoryList } from "@/features/categories/category-list";
import type { AuthContextValue } from "@/providers/auth-provider";
import {
  createCategory,
  listCategories,
  updateCategory,
} from "@/services/categories.service";
import { AdminApiError } from "@/types/api";

vi.mock("@/services/categories.service", () => ({
  listCategories: vi.fn(),
  createCategory: vi.fn(),
  updateCategory: vi.fn(),
  getCategory: vi.fn(),
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

const parentCategory = {
  id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  storeId,
  name: "Apparel",
  slug: "apparel",
  description: "Clothing",
  createdAt: "2026-07-20T10:00:00.000Z",
  updatedAt: "2026-07-20T10:00:00.000Z",
};

const sampleCategory = {
  id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  storeId,
  name: "Shoes",
  slug: "shoes",
  description: "Footwear",
  parentId: parentCategory.id,
  createdAt: "2026-07-20T11:00:00.000Z",
  updatedAt: "2026-07-20T11:00:00.000Z",
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

function renderList() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <CategoryList />
    </QueryClientProvider>,
  );
}

describe("CategoryList", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders categories from the API with parent names", async () => {
    useAuthMock.mockReturnValue(authValue());
    vi.mocked(listCategories).mockResolvedValue({
      items: [sampleCategory, parentCategory],
      total: 2,
      page: 1,
      limit: 20,
      totalPages: 1,
    });

    renderList();

    expect(await screen.findByText("Shoes")).toBeInTheDocument();
    expect(screen.getByText("shoes")).toBeInTheDocument();
    expect(screen.getAllByText("Apparel").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Active").length).toBeGreaterThanOrEqual(1);
  });

  it("creates a category from the dialog", async () => {
    const user = userEvent.setup();
    useAuthMock.mockReturnValue(authValue());
    vi.mocked(listCategories).mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 0,
    });
    vi.mocked(createCategory).mockResolvedValue({
      ...sampleCategory,
      name: "Accessories",
      slug: "accessories",
      description: undefined,
      parentId: undefined,
    });

    renderList();

    await screen.findByText("No categories found");
    await user.click(
      screen.getAllByRole("button", { name: "Add Category" })[0]!,
    );
    await user.type(screen.getByLabelText("Name"), "Accessories");
    await waitFor(() => {
      expect(screen.getByLabelText("Slug")).toHaveValue("accessories");
    });
    await user.click(screen.getByRole("button", { name: "Create category" }));

    await waitFor(() => {
      expect(createCategory).toHaveBeenCalledWith({
        storeId,
        name: "Accessories",
        slug: "accessories",
        description: undefined,
        parentId: undefined,
      });
    });
    expect(toastMock).toHaveBeenCalledWith("Accessories created");
  });

  it("updates a category from the edit dialog", async () => {
    const user = userEvent.setup();
    useAuthMock.mockReturnValue(authValue());
    vi.mocked(listCategories).mockResolvedValue({
      items: [sampleCategory, parentCategory],
      total: 2,
      page: 1,
      limit: 20,
      totalPages: 1,
    });
    vi.mocked(updateCategory).mockResolvedValue({
      ...sampleCategory,
      name: "Footwear",
    });

    renderList();

    await screen.findByText("Shoes");
    await user.click(screen.getAllByRole("button", { name: "Edit" })[0]!);

    const name = screen.getByLabelText("Name");
    await user.clear(name);
    await user.type(name, "Footwear");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => {
      expect(updateCategory).toHaveBeenCalledWith(
        sampleCategory.id,
        expect.objectContaining({
          name: "Footwear",
          slug: "shoes",
          parentId: parentCategory.id,
        }),
        { storeId },
      );
    });
    expect(toastMock).toHaveBeenCalledWith("Footwear updated");
  });

  it("shows an error state with retry", async () => {
    useAuthMock.mockReturnValue(authValue());
    vi.mocked(listCategories).mockRejectedValue(
      new AdminApiError("FORBIDDEN", "Forbidden", 403),
    );

    renderList();

    expect(
      await screen.findByText("Unable to load categories"),
    ).toBeInTheDocument();
    expect(screen.getByText("Forbidden")).toBeInTheDocument();
  });
});
