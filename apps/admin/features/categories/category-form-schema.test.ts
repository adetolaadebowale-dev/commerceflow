import { describe, expect, it } from "vitest";

import {
  categoryFormSchema,
  slugifyCategoryName,
  toCategoryPayload,
} from "@/features/categories/category-form-schema";

describe("category-form-schema", () => {
  it("slugifies category names", () => {
    expect(slugifyCategoryName("Mens Apparel!")).toBe("mens-apparel");
  });

  it("strips empty description and parent before API payload", () => {
    const parsed = categoryFormSchema.parse({
      name: "Apparel",
      slug: "apparel",
      description: "  ",
      parentId: "",
    });
    expect(toCategoryPayload(parsed)).toEqual({
      name: "Apparel",
      slug: "apparel",
      description: undefined,
      parentId: undefined,
    });
  });

  it("keeps parentId when set", () => {
    const parentId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
    const parsed = categoryFormSchema.parse({
      name: "Shoes",
      slug: "shoes",
      description: "Footwear",
      parentId,
    });
    expect(toCategoryPayload(parsed)).toEqual({
      name: "Shoes",
      slug: "shoes",
      description: "Footwear",
      parentId,
    });
  });

  it("rejects invalid slugs", () => {
    const parsed = categoryFormSchema.safeParse({
      name: "Apparel",
      slug: "Mens Apparel",
      description: "",
      parentId: "",
    });
    expect(parsed.success).toBe(false);
  });
});
