import { describe, expect, it } from "vitest";

import {
  brandFormSchema,
  slugifyBrandName,
  toBrandPayload,
} from "@/features/brands/brand-form-schema";

describe("brand-form-schema", () => {
  it("slugifies brand names", () => {
    expect(slugifyBrandName("Acme Apparel!")).toBe("acme-apparel");
  });

  it("strips empty description before API payload", () => {
    const parsed = brandFormSchema.parse({
      name: "Acme",
      slug: "acme",
      description: "  ",
    });
    expect(toBrandPayload(parsed)).toEqual({
      name: "Acme",
      slug: "acme",
      description: undefined,
    });
  });

  it("rejects invalid slugs", () => {
    const parsed = brandFormSchema.safeParse({
      name: "Acme",
      slug: "Acme Apparel",
      description: "",
    });
    expect(parsed.success).toBe(false);
  });
});
