import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { InventoryTable } from "@/features/inventory/inventory-table";
import type { InventoryRow } from "@/features/inventory/inventory-mappers";

vi.mock("@/features/inventory/use-inventory-history", () => ({
  useInventoryHistory: () => ({
    data: { rows: [], total: 0, page: 1, totalPages: 0 },
    isLoading: false,
    isError: false,
    isFetching: false,
    refetch: vi.fn(),
  }),
}));

const row: InventoryRow = {
  inventoryItemId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  productVariantId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
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

describe("InventoryTable", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders inventory rows and opens adjust dialog", async () => {
    const user = userEvent.setup();
    const onAdjust = vi.fn().mockResolvedValue(undefined);

    render(
      <InventoryTable
        storeId="11111111-1111-1111-1111-111111111111"
        rows={[row]}
        onAdjust={onAdjust}
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
});
