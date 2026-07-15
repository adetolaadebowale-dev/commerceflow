import { describe, expect, it } from "vitest";

import {
  createInventoryAdjustmentSchema,
  listInventoryAdjustmentsQuerySchema,
} from "./inventory-adjustment.schemas";

describe("inventory adjustment schemas", () => {
  it("validates create inventory adjustment input", () => {
    const parsed = createInventoryAdjustmentSchema.safeParse({
      storeId: "11111111-1111-1111-1111-111111111111",
      inventoryItemId: "22222222-2222-2222-2222-222222222222",
      movementQuantity: 5,
      reason: "Found stock",
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects zero movement quantity", () => {
    const parsed = createInventoryAdjustmentSchema.safeParse({
      storeId: "11111111-1111-1111-1111-111111111111",
      inventoryItemId: "22222222-2222-2222-2222-222222222222",
      movementQuantity: 0,
      reason: "Invalid",
    });

    expect(parsed.success).toBe(false);
  });

  it("validates list query", () => {
    const parsed = listInventoryAdjustmentsQuerySchema.safeParse({
      storeId: "11111111-1111-1111-1111-111111111111",
    });

    expect(parsed.success).toBe(true);
  });
});
