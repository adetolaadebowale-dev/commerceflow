import { describe, expect, it } from "vitest";

import {
  createBrandSchema,
  listBrandsQuerySchema,
  updateBrandSchema,
} from "./brand.schemas";

const TEST_STORE_ID = "11111111-1111-1111-1111-111111111111";

describe("brand schemas", () => {
  it("validates brand creation input", () => {
    const parsed = createBrandSchema.safeParse({
      storeId: TEST_STORE_ID,
      name: "Acme",
      slug: "acme",
      description: "Acme brand",
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects brand creation without a name", () => {
    const parsed = createBrandSchema.safeParse({
      storeId: TEST_STORE_ID,
      slug: "acme",
    });

    expect(parsed.success).toBe(false);
  });

  it("rejects brand creation without a slug", () => {
    const parsed = createBrandSchema.safeParse({
      storeId: TEST_STORE_ID,
      name: "Acme",
    });

    expect(parsed.success).toBe(false);
  });

  it("validates partial brand updates", () => {
    const parsed = updateBrandSchema.safeParse({
      name: "Updated Acme",
    });

    expect(parsed.success).toBe(true);
  });

  it("parses brand list query params", () => {
    const parsed = listBrandsQuerySchema.safeParse({
      storeId: TEST_STORE_ID,
      page: "2",
      limit: "10",
      search: "acme",
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.page).toBe(2);
      expect(parsed.data.limit).toBe(10);
    }
  });
});
