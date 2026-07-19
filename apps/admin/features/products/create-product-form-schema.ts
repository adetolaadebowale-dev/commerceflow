import { createProductSchema } from "@commerceflow/validation";
import { z } from "zod";

/** UI form schema derived from shared createProductSchema (no storeId / variants). */
export const createProductFormSchema = createProductSchema
  .omit({
    storeId: true,
    variants: true,
    brandId: true,
    status: true,
    description: true,
  })
  .extend({
    description: z
      .string()
      .trim()
      .max(2000, "Description must be at most 2000 characters"),
    status: z.enum(["draft", "active"]),
    brandId: z.union([
      z.literal(""),
      z.string().uuid("Brand id must be a valid UUID"),
    ]),
  });

export type CreateProductFormValues = z.infer<typeof createProductFormSchema>;

export function slugifyProductName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

export function buildDefaultVariant(slug: string) {
  const skuBase = slug
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);

  return {
    sku: `${skuBase || "PRODUCT"}-DEFAULT`.slice(0, 120),
    name: "Default",
    price: "0.00",
    currency: "USD",
  } as const;
}
