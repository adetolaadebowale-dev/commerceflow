import { PRODUCT_STATUSES } from "@commerceflow/types";
import { z } from "zod";

const slugSchema = z
  .string()
  .trim()
  .min(1, "Slug is required")
  .max(120, "Slug must be at most 120 characters")
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Slug must contain lowercase letters, numbers, and hyphens only",
  );

const nameSchema = z
  .string()
  .trim()
  .min(1, "Name is required")
  .max(200, "Name must be at most 200 characters");

const descriptionSchema = z
  .string()
  .trim()
  .max(2000, "Description must be at most 2000 characters")
  .optional();

const storeIdSchema = z.string().uuid("Store id must be a valid UUID");

export const createCategorySchema = z.object({
  storeId: storeIdSchema,
  name: nameSchema,
  slug: slugSchema,
  description: descriptionSchema,
  parentId: z.string().uuid("Parent category id must be a valid UUID").optional(),
});

export const updateCategorySchema = createCategorySchema
  .omit({ storeId: true })
  .partial();

export const listCategoriesQuerySchema = z.object({
  storeId: storeIdSchema,
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  parentId: z.string().uuid().optional(),
  search: z.string().trim().max(200).optional(),
});

export const categoryIdQuerySchema = z.object({
  storeId: storeIdSchema,
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type ListCategoriesQuery = z.infer<typeof listCategoriesQuerySchema>;

export const productVariantInputSchema = z.object({
  sku: z
    .string()
    .trim()
    .min(1, "SKU is required")
    .max(120, "SKU must be at most 120 characters"),
  name: z
    .string()
    .trim()
    .min(1, "Variant name is required")
    .max(200, "Variant name must be at most 200 characters"),
  price: z
    .string()
    .trim()
    .regex(/^\d+(\.\d{1,2})?$/, "Price must be a valid decimal amount"),
  currency: z
    .string()
    .trim()
    .length(3, "Currency must be a 3-letter ISO code")
    .transform((value) => value.toUpperCase()),
  attributes: z.record(z.string(), z.string()).optional(),
});

export const createProductSchema = z.object({
  storeId: storeIdSchema,
  name: nameSchema,
  slug: slugSchema,
  description: descriptionSchema,
  status: z.enum(PRODUCT_STATUSES).default("draft"),
  categoryId: z.string().uuid("Category id must be a valid UUID"),
  brandId: z.string().uuid("Brand id must be a valid UUID").optional(),
  variants: z
    .array(productVariantInputSchema)
    .min(1, "At least one variant is required"),
});

export const updateProductSchema = createProductSchema
  .omit({ storeId: true, variants: true })
  .partial();

export const listProductsQuerySchema = z.object({
  storeId: storeIdSchema,
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  categoryId: z.string().uuid().optional(),
  brandId: z.string().uuid().optional(),
  status: z.enum(PRODUCT_STATUSES).optional(),
  search: z.string().trim().max(200).optional(),
});

export const productIdQuerySchema = z.object({
  storeId: storeIdSchema,
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ListProductsQuery = z.infer<typeof listProductsQuerySchema>;
export type ProductVariantInput = z.infer<typeof productVariantInputSchema>;
