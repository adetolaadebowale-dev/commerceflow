import { describe, expect, it } from "vitest";

import {
  addCartItemSchema,
  createCartSchema,
  updateCartItemSchema,
} from "./cart.schemas";

describe("cart schemas", () => {
  it("validates cart creation input", () => {
    const parsed = createCartSchema.safeParse({
      storeId: "11111111-1111-1111-1111-111111111111",
      customerId: "22222222-2222-2222-2222-222222222222",
    });

    expect(parsed.success).toBe(true);
  });

  it("validates add cart item input", () => {
    const parsed = addCartItemSchema.safeParse({
      productVariantId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      quantity: 2,
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects non-positive cart item quantity", () => {
    const parsed = addCartItemSchema.safeParse({
      productVariantId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      quantity: 0,
    });

    expect(parsed.success).toBe(false);
  });

  it("validates cart item update input", () => {
    const parsed = updateCartItemSchema.safeParse({
      quantity: 3,
    });

    expect(parsed.success).toBe(true);
  });
});
