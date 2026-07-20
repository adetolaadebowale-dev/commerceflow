import { describe, expect, it } from "vitest";

import {
  formatAttributeSummary,
  generateVariantName,
  getVariantDisplayName,
  variantFormSchema,
} from "@/features/products/variants/variant-form-schema";

describe("variantFormSchema", () => {
  it("accepts a valid variant payload", () => {
    const parsed = variantFormSchema.safeParse({
      sku: "TEE-XL-BLK",
      name: "Size: XL · Color: Black",
      price: "29.99",
      currency: "usd",
      attributes: { Size: "XL", Color: "Black" },
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.currency).toBe("USD");
    }
  });

  it("rejects empty attributes", () => {
    const parsed = variantFormSchema.safeParse({
      sku: "TEE-XL",
      name: "Tee",
      price: "10.00",
      currency: "USD",
      attributes: {},
    });

    expect(parsed.success).toBe(false);
  });

  it("rejects invalid price", () => {
    const parsed = variantFormSchema.safeParse({
      sku: "TEE-XL",
      name: "Tee",
      price: "10.999",
      currency: "USD",
      attributes: { Size: "XL" },
    });

    expect(parsed.success).toBe(false);
  });
});

describe("variant display helpers", () => {
  it("formats attribute summaries", () => {
    expect(formatAttributeSummary({ Size: "XL", Color: "Black" })).toBe(
      "Size: XL · Color: Black",
    );
  });

  it("generates names from attributes", () => {
    expect(generateVariantName({ Size: "XL" })).toBe("Size: XL");
  });

  it("prefers explicit non-default names", () => {
    expect(
      getVariantDisplayName({
        name: "Limited edition",
        attributes: { Size: "M" },
      }),
    ).toBe("Limited edition");
  });

  it("falls back to attributes when name is Default", () => {
    expect(
      getVariantDisplayName({
        name: "Default",
        attributes: { Color: "Red" },
      }),
    ).toBe("Color: Red");
  });
});
