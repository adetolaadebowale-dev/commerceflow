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

export const createBrandSchema = z.object({
  storeId: storeIdSchema,
  name: nameSchema,
  slug: slugSchema,
  description: descriptionSchema,
});

export const updateBrandSchema = createBrandSchema
  .omit({ storeId: true })
  .partial();

export const listBrandsQuerySchema = z.object({
  storeId: storeIdSchema,
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(200).optional(),
});

export const brandIdQuerySchema = z.object({
  storeId: storeIdSchema,
});

export type CreateBrandInput = z.infer<typeof createBrandSchema>;
export type UpdateBrandInput = z.infer<typeof updateBrandSchema>;
export type ListBrandsQuery = z.infer<typeof listBrandsQuerySchema>;
