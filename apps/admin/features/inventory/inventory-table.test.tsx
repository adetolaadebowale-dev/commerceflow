import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { InventoryTable } from "@/features/inventory/inventory-table";
import type { InventoryRow } from "@/features/inventory/inventory-mappers";
import { listWarehouses } from "@/services/warehouses.service";

vi.mock("@/features/inventory/use-inventory-history", () => ({
  useInventoryHistory: () => ({
    data: { rows: [], total: 0, page: 1, totalPages: 0 },
    isLoading: false,
    isError: false,
    isFetching: false,
    refetch: vi.fn(),
  }),
}));

vi.mock("@/services/warehouses.service", () => ({
  listWarehouses: vi.fn(),
}));

const storeId = "11111111-1111-1111-1111-111111111111";

const variant = {
  id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  productId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  sku: "TEE-XL",
  name: "Size: XL",
  price: "29.00",
  currency: "USD",
  attributes: { Size: "XL" },
  createdAt: "2026-07-20T12:00:00.000Z",
  updatedAt: "2026-07-20T12:00:00.000Z",
};

const row: InventoryRow = {
  inventoryItemId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  productVariantId: variant.id,
  warehouseId: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
  sku: "TEE-XL",
  variantSummary: "Size: XL",
  quantityOnHand: 12,
  reservedQuantity: 2,
  availableQuantity: 10,
  updatedAt: "2026-07-20T12:00:00.000Z",
  stockStatus: "ok",
  reorderPoint: null,
};

function renderTable(ui: ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>{ui}</QueryClientProvider>,
  );
}

describe("InventoryTable", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders inventory rows and opens adjust dialog", async () => {
    const user = userEvent.setup();
    const onAdjust = vi.fn().mockResolvedValue(undefined);

    renderTable(
      <InventoryTable
        storeId={storeId}
        variants={[variant]}
        rows={[row]}
        onAdjust={onAdjust}
        onCreate={vi.fn()}
      />,
    );

    expect(screen.getByText("TEE-XL")).toBeInTheDocument();
    expect(screen.getByText("Size: XL")).toBeInTheDocument();
    expect(screen.getByText("In stock")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Adjust" }));
    expect(
      await screen.findByRole("heading", { name: "Adjust inventory" }),
    ).toBeInTheDocument();
  });

  it("shows create inventory empty state and opens dialog", async () => {
    const user = userEvent.setup();
    vi.mocked(listWarehouses).mockResolvedValue({
      items: [
        {
          id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
          storeId,
          name: "Main Warehouse",
          code: "MAIN",
          address: "100 Market St",
          city: "Austin",
          stateProvince: "TX",
          postalCode: "78701",
          countryCode: "US",
          status: "active",
          isDefault: true,
          createdAt: "2026-07-20T10:00:00.000Z",
          updatedAt: "2026-07-20T10:00:00.000Z",
        },
      ],
      total: 1,
      page: 1,
      limit: 100,
      totalPages: 1,
    });

    renderTable(
      <InventoryTable
        storeId={storeId}
        variants={[variant]}
        rows={[]}
        onAdjust={vi.fn()}
        onCreate={vi.fn()}
      />,
    );

    expect(
      screen.getByText("No inventory yet"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Create inventory for a variant and warehouse to begin tracking stock.",
      ),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Create Inventory" }));
    expect(
      await screen.findByRole("heading", { name: "Create inventory" }),
    ).toBeInTheDocument();
    expect(await screen.findByLabelText("Warehouse")).toBeInTheDocument();
    expect(screen.getByLabelText("Initial quantity")).toBeInTheDocument();
    expect(
      await screen.findByText(/Main Warehouse \(Default\)/),
    ).toBeInTheDocument();
  });

  it("links to warehouses when none are active", async () => {
    const user = userEvent.setup();
    vi.mocked(listWarehouses).mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      limit: 100,
      totalPages: 0,
    });

    renderTable(
      <InventoryTable
        storeId={storeId}
        variants={[variant]}
        rows={[]}
        onAdjust={vi.fn()}
        onCreate={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Create Inventory" }));
    expect(
      await screen.findByText(
        "You must create a warehouse before inventory can be initialized.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Go to Warehouses" }),
    ).toHaveAttribute("href", "/dashboard/warehouses");
  });
});
