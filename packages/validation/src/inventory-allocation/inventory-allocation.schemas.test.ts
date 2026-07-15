import { describe, expect, it } from "vitest";

import {
  allocateInventorySchema,
  inventoryAllocationIdQuerySchema,
  reportShortageSchema,
  updateInventoryAllocationSchema,
} from "./inventory-allocation.schemas";

describe("inventory allocation schemas", () => {
  it("validates allocate inventory input", () => {
    const parsed = allocateInventorySchema.safeParse({
      inventoryItemId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      quantityAllocated: 2,
    });

    expect(parsed.success).toBe(true);
  });

  it("validates update picked quantity input", () => {
    const parsed = updateInventoryAllocationSchema.safeParse({
      quantityPicked: 1,
    });

    expect(parsed.success).toBe(true);
  });

  it("validates report shortage input", () => {
    const parsed = reportShortageSchema.safeParse({
      shortageReason: "Stock missing in aisle 3",
    });

    expect(parsed.success).toBe(true);
  });

  it("validates inventory allocation id query", () => {
    const parsed = inventoryAllocationIdQuerySchema.safeParse({
      storeId: "11111111-1111-1111-1111-111111111111",
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects zero allocation quantity", () => {
    const parsed = allocateInventorySchema.safeParse({
      inventoryItemId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      quantityAllocated: 0,
    });

    expect(parsed.success).toBe(false);
  });

  it("rejects empty shortage reason", () => {
    const parsed = reportShortageSchema.safeParse({
      shortageReason: "   ",
    });

    expect(parsed.success).toBe(false);
  });
});
