import { describe, expect, it } from "vitest";

import {
  createReplenishmentRuleSchema,
  updateReplenishmentRuleSchema,
} from "./replenishment.schemas";

describe("replenishment schemas", () => {
  it("accepts valid replenishment rule input", () => {
    const parsed = createReplenishmentRuleSchema.safeParse({
      storeId: "11111111-1111-1111-1111-111111111111",
      warehouseId: "22222222-2222-2222-2222-222222222222",
      productVariantId: "33333333-3333-3333-3333-333333333333",
      supplierId: "44444444-4444-4444-4444-444444444444",
      reorderPoint: 10,
      reorderQuantity: 25,
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects minimum quantity above reorder point", () => {
    const parsed = createReplenishmentRuleSchema.safeParse({
      storeId: "11111111-1111-1111-1111-111111111111",
      warehouseId: "22222222-2222-2222-2222-222222222222",
      productVariantId: "33333333-3333-3333-3333-333333333333",
      supplierId: "44444444-4444-4444-4444-444444444444",
      reorderPoint: 10,
      reorderQuantity: 25,
      minimumQuantity: 15,
    });

    expect(parsed.success).toBe(false);
  });

  it("requires at least one field on rule update", () => {
    const parsed = updateReplenishmentRuleSchema.safeParse({});

    expect(parsed.success).toBe(false);
  });
});
