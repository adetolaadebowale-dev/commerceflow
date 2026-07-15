import { describe, expect, it } from "vitest";

import {
  approveCycleCountSchema,
  createCycleCountSchema,
  cycleCountIdQuerySchema,
  listCycleCountsQuerySchema,
  updateCycleCountSchema,
} from "./cycle-count.schemas";

describe("cycle count schemas", () => {
  it("validates create cycle count input", () => {
    const parsed = createCycleCountSchema.safeParse({
      storeId: "11111111-1111-1111-1111-111111111111",
      inventoryItemIds: ["22222222-2222-2222-2222-222222222222"],
    });

    expect(parsed.success).toBe(true);
  });

  it("validates complete cycle count input", () => {
    const parsed = updateCycleCountSchema.safeParse({
      storeId: "11111111-1111-1111-1111-111111111111",
      items: [
        {
          cycleCountItemId: "33333333-3333-3333-3333-333333333333",
          countedQuantity: 4,
        },
      ],
    });

    expect(parsed.success).toBe(true);
  });

  it("validates approve and id query schemas", () => {
    expect(
      approveCycleCountSchema.safeParse({
        storeId: "11111111-1111-1111-1111-111111111111",
      }).success,
    ).toBe(true);
    expect(
      cycleCountIdQuerySchema.safeParse({
        storeId: "11111111-1111-1111-1111-111111111111",
      }).success,
    ).toBe(true);
    expect(
      listCycleCountsQuerySchema.safeParse({
        storeId: "11111111-1111-1111-1111-111111111111",
      }).success,
    ).toBe(true);
  });
});
