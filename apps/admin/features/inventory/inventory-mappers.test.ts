import { describe, expect, it } from "vitest";
import type {
  InventoryItem,
  InventorySummary,
  ProductVariant,
} from "@commerceflow/types";

import { buildInventoryRows } from "@/features/inventory/inventory-mappers";

const variant: ProductVariant = {
  id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  productId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  sku: "TEE-XL",
  name: "Default",
  price: "20.00",
  currency: "USD",
  attributes: { Size: "XL" },
  createdAt: "2026-07-20T12:00:00.000Z",
  updatedAt: "2026-07-20T12:00:00.000Z",
};

const item: InventoryItem = {
  id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  storeId: "11111111-1111-1111-1111-111111111111",
  warehouseId: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
  productVariantId: variant.id,
  quantityOnHand: 12,
  createdAt: "2026-07-20T12:00:00.000Z",
  updatedAt: "2026-07-20T13:00:00.000Z",
};

describe("buildInventoryRows", () => {
  it("uses report metrics for reserved and available quantities", () => {
    const summary = {
      byProductVariant: [
        {
          warehouseId: item.warehouseId,
          productVariantId: variant.id,
          quantityOnHand: 12,
          quantityReserved: 3,
          quantityAllocated: 0,
          quantityAvailable: 9,
          quantityIncoming: 0,
          quantityOutgoing: 0,
          inventoryValue: "0",
        },
      ],
      lowStockItems: [],
      outOfStockItems: [],
    } as unknown as InventorySummary;

    const rows = buildInventoryRows({
      variants: [variant],
      items: [item],
      summary,
    });

    expect(rows).toHaveLength(1);
    expect(rows[0]?.sku).toBe("TEE-XL");
    expect(rows[0]?.variantSummary).toBe("Size: XL");
    expect(rows[0]?.reservedQuantity).toBe(3);
    expect(rows[0]?.availableQuantity).toBe(9);
    expect(rows[0]?.stockStatus).toBe("ok");
  });

  it("marks low stock from summary reorder configuration", () => {
    const summary = {
      byProductVariant: [
        {
          warehouseId: item.warehouseId,
          productVariantId: variant.id,
          quantityOnHand: 2,
          quantityReserved: 0,
          quantityAllocated: 0,
          quantityAvailable: 2,
          quantityIncoming: 0,
          quantityOutgoing: 0,
          inventoryValue: "0",
        },
      ],
      lowStockItems: [
        {
          inventoryItemId: item.id,
          warehouseId: item.warehouseId,
          productVariantId: variant.id,
          quantityOnHand: 2,
          quantityAvailable: 2,
          reorderPoint: 5,
        },
      ],
      outOfStockItems: [],
    } as unknown as InventorySummary;

    const rows = buildInventoryRows({
      variants: [variant],
      items: [item],
      summary,
    });

    expect(rows[0]?.stockStatus).toBe("low");
    expect(rows[0]?.reorderPoint).toBe(5);
  });
});
