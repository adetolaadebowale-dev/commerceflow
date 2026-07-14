import { describe, expect, it } from "vitest";

import {
  createInventoryItemSchema,
  createStockMovementSchema,
  listInventoryItemsQuerySchema,
} from "./inventory.schemas";

const TEST_STORE_ID = "11111111-1111-1111-1111-111111111111";
const TEST_VARIANT_ID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";

describe("inventory schemas", () => {
  it("validates inventory item creation input", () => {
    const parsed = createInventoryItemSchema.safeParse({
      storeId: TEST_STORE_ID,
      productVariantId: TEST_VARIANT_ID,
      initialQuantity: 10,
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects negative initial quantity", () => {
    const parsed = createInventoryItemSchema.safeParse({
      storeId: TEST_STORE_ID,
      productVariantId: TEST_VARIANT_ID,
      initialQuantity: -1,
    });

    expect(parsed.success).toBe(false);
  });

  it("validates stock movement creation input", () => {
    const parsed = createStockMovementSchema.safeParse({
      storeId: TEST_STORE_ID,
      inventoryItemId: "22222222-2222-2222-2222-222222222222",
      quantityChange: -3,
      reason: "manual_adjustment",
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects zero quantity changes", () => {
    const parsed = createStockMovementSchema.safeParse({
      storeId: TEST_STORE_ID,
      inventoryItemId: "22222222-2222-2222-2222-222222222222",
      quantityChange: 0,
      reason: "manual_adjustment",
    });

    expect(parsed.success).toBe(false);
  });

  it("rejects initial reason on adjustments", () => {
    const parsed = createStockMovementSchema.safeParse({
      storeId: TEST_STORE_ID,
      inventoryItemId: "22222222-2222-2222-2222-222222222222",
      quantityChange: 5,
      reason: "initial",
    });

    expect(parsed.success).toBe(false);
  });

  it("parses inventory list query params", () => {
    const parsed = listInventoryItemsQuerySchema.safeParse({
      storeId: TEST_STORE_ID,
      page: "2",
      limit: "10",
      productVariantId: TEST_VARIANT_ID,
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.page).toBe(2);
      expect(parsed.data.limit).toBe(10);
    }
  });
});
