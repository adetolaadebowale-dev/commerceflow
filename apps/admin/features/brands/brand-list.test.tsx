import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { BrandList } from "@/features/brands/brand-list";
import type { AuthContextValue } from "@/providers/auth-provider";
import {
  createBrand,
  deactivateBrand,
  listBrands,
  updateBrand,
} from "@/services/brands.service";
import { AdminApiError } from "@/types/api";

vi.mock("@/services/brands.service", () => ({
  listBrands: vi.fn(),
  createBrand: vi.fn(),
  updateBrand: vi.fn(),
  deactivateBrand: vi.fn(),
  getBrand: vi.fn(),
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

const sampleBrand = {
  id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  storeId,
  name: "Acme Apparel",
  slug: "acme-apparel",
  description: "Everyday basics",
  createdAt: "2026-07-20T10:00:00.000Z",
  updatedAt: "2026-07-20T10:00:00.000Z",
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
      <BrandList />
    </QueryClientProvider>,
  );
}

describe("BrandList", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders brands from the API", async () => {
    useAuthMock.mockReturnValue(authValue());
    vi.mocked(listBrands).mockResolvedValue({
      items: [sampleBrand],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    });

    renderList();

    expect(await screen.findByText("Acme Apparel")).toBeInTheDocument();
    expect(screen.getByText("acme-apparel")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("creates a brand from the dialog", async () => {
    const user = userEvent.setup();
    useAuthMock.mockReturnValue(authValue());
    vi.mocked(listBrands).mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 0,
    });
    vi.mocked(createBrand).mockResolvedValue({
      ...sampleBrand,
      name: "Northwind",
      slug: "northwind",
      description: undefined,
    });

    renderList();

    await screen.findByText("No brands found");
    await user.click(screen.getAllByRole("button", { name: "Add Brand" })[0]!);
    await user.type(screen.getByLabelText("Name"), "Northwind");
    await waitFor(() => {
      expect(screen.getByLabelText("Slug")).toHaveValue("northwind");
    });
    await user.click(screen.getByRole("button", { name: "Create brand" }));

    await waitFor(() => {
      expect(createBrand).toHaveBeenCalledWith({
        storeId,
        name: "Northwind",
        slug: "northwind",
        description: undefined,
      });
    });
    expect(toastMock).toHaveBeenCalledWith("Northwind created");
  });

  it("updates a brand from the edit dialog", async () => {
    const user = userEvent.setup();
    useAuthMock.mockReturnValue(authValue());
    vi.mocked(listBrands).mockResolvedValue({
      items: [sampleBrand],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    });
    vi.mocked(updateBrand).mockResolvedValue({
      ...sampleBrand,
      name: "Acme Co",
    });

    renderList();

    await screen.findByText("Acme Apparel");
    await user.click(screen.getByRole("button", { name: "Edit" }));

    const name = screen.getByLabelText("Name");
    await user.clear(name);
    await user.type(name, "Acme Co");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => {
      expect(updateBrand).toHaveBeenCalledWith(
        sampleBrand.id,
        expect.objectContaining({
          name: "Acme Co",
          slug: "acme-apparel",
        }),
        { storeId },
      );
    });
    expect(toastMock).toHaveBeenCalledWith("Acme Co updated");
  });

  it("soft-deactivates a brand", async () => {
    const user = userEvent.setup();
    useAuthMock.mockReturnValue(authValue());
    vi.mocked(listBrands).mockResolvedValue({
      items: [sampleBrand],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    });
    vi.mocked(deactivateBrand).mockResolvedValue(sampleBrand);

    renderList();

    await screen.findByText("Acme Apparel");
    await user.click(screen.getByRole("button", { name: "Deactivate" }));

    const dialog = screen.getByRole("dialog");
    await user.click(
      within(dialog).getByRole("button", { name: "Deactivate" }),
    );

    await waitFor(() => {
      expect(deactivateBrand).toHaveBeenCalledWith(sampleBrand.id, {
        storeId,
      });
    });
    expect(toastMock).toHaveBeenCalledWith("Acme Apparel deactivated");
  });

  it("shows an error state with retry", async () => {
    useAuthMock.mockReturnValue(authValue());
    vi.mocked(listBrands).mockRejectedValue(
      new AdminApiError("FORBIDDEN", "Forbidden", 403),
    );

    renderList();

    expect(await screen.findByText("Unable to load brands")).toBeInTheDocument();
    expect(screen.getByText("Forbidden")).toBeInTheDocument();
  });
});
