import { describe, expect, it } from "vitest";

import {
  completeReturnSchema,
  createReturnSchema,
  inspectReturnSchema,
  receiveReturnSchema,
  returnIdQuerySchema,
} from "./return.schemas";

describe("return schemas", () => {
  it("validates create return input", () => {
    const parsed = createReturnSchema.safeParse({
      storeId: "11111111-1111-1111-1111-111111111111",
      shipmentId: "22222222-2222-2222-2222-222222222222",
      reason: "Wrong size",
      items: [
        {
          orderItemId: "33333333-3333-3333-3333-333333333333",
          inventoryItemId: "44444444-4444-4444-4444-444444444444",
          quantityRequested: 1,
        },
      ],
    });

    expect(parsed.success).toBe(true);
  });

  it("validates receive return input", () => {
    const parsed = receiveReturnSchema.safeParse({
      storeId: "11111111-1111-1111-1111-111111111111",
      items: [
        {
          returnItemId: "33333333-3333-3333-3333-333333333333",
          quantityReceived: 1,
        },
      ],
    });

    expect(parsed.success).toBe(true);
  });

  it("validates inspect return input", () => {
    const parsed = inspectReturnSchema.safeParse({
      storeId: "11111111-1111-1111-1111-111111111111",
      items: [{ returnItemId: "33333333-3333-3333-3333-333333333333", condition: "new" }],
    });

    expect(parsed.success).toBe(true);
  });

  it("validates complete return input", () => {
    const parsed = completeReturnSchema.safeParse({
      storeId: "11111111-1111-1111-1111-111111111111",
    });

    expect(parsed.success).toBe(true);
  });

  it("validates return id query", () => {
    const parsed = returnIdQuerySchema.safeParse({
      storeId: "11111111-1111-1111-1111-111111111111",
    });

    expect(parsed.success).toBe(true);
  });
});
