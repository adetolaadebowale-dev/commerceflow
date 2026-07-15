import { describe, expect, it } from "vitest";

import {
  createFulfillmentSchema,
  stockMovementIdQuerySchema,
} from "./fulfillment.schemas";

describe("fulfillment schemas", () => {
  it("validates create fulfillment input", () => {
    const parsed = createFulfillmentSchema.safeParse({
      storeId: "11111111-1111-1111-1111-111111111111",
    });

    expect(parsed.success).toBe(true);
  });

  it("validates stock movement id query", () => {
    const parsed = stockMovementIdQuerySchema.safeParse({
      storeId: "11111111-1111-1111-1111-111111111111",
    });

    expect(parsed.success).toBe(true);
  });
});
