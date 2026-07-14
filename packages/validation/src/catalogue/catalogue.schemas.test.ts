import { describe, expect, it } from "vitest";

import {
  createCategorySchema,
  createProductSchema,
  listCategoriesQuerySchema,
} from "./catalogue.schemas";

const TEST_STORE_ID = "11111111-1111-1111-1111-111111111111";

describe("catalogue schemas", () => {
  it("validates category creation input", () => {
    const parsed = createCategorySchema.safeParse({
      storeId: TEST_STORE_ID,
      name: "Accessories",
      slug: "accessories",
      description: "Accessory products",
    });

    expect(parsed.success).toBe(true);
  });

  it("validates product creation input", () => {
    const parsed = createProductSchema.safeParse({
      storeId: TEST_STORE_ID,
      name: "Classic Tee",
      slug: "classic-tee",
      categoryId: "22222222-2222-2222-2222-222222222222",
      variants: [
        {
          sku: "TEE-001",
          name: "Default",
          price: "19.99",
          currency: "usd",
        },
      ],
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.status).toBe("draft");
      expect(parsed.data.variants[0]?.currency).toBe("USD");
    }
  });

  it("rejects products without variants", () => {
    const parsed = createProductSchema.safeParse({
      storeId: TEST_STORE_ID,
      name: "Classic Tee",
      slug: "classic-tee",
      categoryId: "22222222-2222-2222-2222-222222222222",
      variants: [],
    });

    expect(parsed.success).toBe(false);
  });

  it("parses list query params", () => {
    const parsed = listCategoriesQuerySchema.safeParse({
      storeId: TEST_STORE_ID,
      page: "2",
      limit: "10",
      search: "accessories",
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.page).toBe(2);
      expect(parsed.data.limit).toBe(10);
    }
  });
});
