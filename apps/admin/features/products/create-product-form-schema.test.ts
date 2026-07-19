import { describe, expect, it } from "vitest";

import {
  buildDefaultVariant,
  createProductFormSchema,
  slugifyProductName,
} from "@/features/products/create-product-form-schema";
import { mapApiValidationErrors } from "@/features/products/map-api-validation-errors";
import { AdminApiError } from "@/types/api";

describe("createProductFormSchema", () => {
  it("accepts a valid draft product payload", () => {
    const parsed = createProductFormSchema.safeParse({
      name: "Classic Tee",
      slug: "classic-tee",
      description: "Soft cotton tee",
      status: "draft",
      categoryId: "22222222-2222-4222-8222-222222222202",
      brandId: "",
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects an invalid slug", () => {
    const parsed = createProductFormSchema.safeParse({
      name: "Classic Tee",
      slug: "Classic Tee",
      status: "active",
      categoryId: "22222222-2222-4222-8222-222222222202",
      brandId: "",
    });

    expect(parsed.success).toBe(false);
  });

  it("slugifies product names for suggestions", () => {
    expect(slugifyProductName("Classic Tee!")).toBe("classic-tee");
  });

  it("builds a default variant for the create API", () => {
    expect(buildDefaultVariant("classic-tee")).toEqual({
      sku: "CLASSIC-TEE-DEFAULT",
      name: "Default",
      price: "0.00",
      currency: "USD",
    });
  });
});

describe("mapApiValidationErrors", () => {
  it("maps Zod flatten field errors", () => {
    const mapped = mapApiValidationErrors(
      new AdminApiError("VALIDATION_ERROR", "Validation failed", 400, {
        formErrors: [],
        fieldErrors: {
          slug: ["Slug must contain lowercase letters, numbers, and hyphens only"],
          categoryId: ["Category id must be a valid UUID"],
        },
      }),
    );

    expect(mapped.fieldErrors.slug).toContain("lowercase");
    expect(mapped.fieldErrors.categoryId).toContain("UUID");
    expect(mapped.formMessage).toBe("Validation failed");
  });
});
