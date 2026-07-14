import { describe, expect, it } from "vitest";

import {
  createOrderSchema,
  listOrdersQuerySchema,
  orderStoreActionSchema,
} from "./order.schemas";

const TEST_STORE_ID = "11111111-1111-1111-1111-111111111111";
const TEST_VARIANT_ID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";

describe("order schemas", () => {
  it("validates order creation input", () => {
    const parsed = createOrderSchema.safeParse({
      storeId: TEST_STORE_ID,
      customerId: "cccccccc-cccc-cccc-cccc-cccccccccccc",
      items: [{ productVariantId: TEST_VARIANT_ID, quantity: 2 }],
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.status).toBe("draft");
    }
  });

  it("rejects orders without items", () => {
    const parsed = createOrderSchema.safeParse({
      storeId: TEST_STORE_ID,
      items: [],
    });

    expect(parsed.success).toBe(false);
  });

  it("rejects invalid item quantity", () => {
    const parsed = createOrderSchema.safeParse({
      storeId: TEST_STORE_ID,
      items: [{ productVariantId: TEST_VARIANT_ID, quantity: 0 }],
    });

    expect(parsed.success).toBe(false);
  });

  it("parses order list query params", () => {
    const parsed = listOrdersQuerySchema.safeParse({
      storeId: TEST_STORE_ID,
      page: "2",
      limit: "10",
      status: "confirmed",
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.page).toBe(2);
      expect(parsed.data.status).toBe("confirmed");
    }
  });

  it("validates store-scoped order action query params", () => {
    const parsed = orderStoreActionSchema.safeParse({
      storeId: TEST_STORE_ID,
    });

    expect(parsed.success).toBe(true);
  });
});
