import { createCategorySchema } from "@commerceflow/validation";
import { z } from "zod";

/** UI form schema derived from shared createCategorySchema (no storeId). */
export const categoryFormSchema = createCategorySchema
  .omit({ storeId: true })
  .extend({
    description: z
      .string()
      .trim()
      .max(2000, "Description must be at most 2000 characters"),
    /** Empty string means no parent; converted to undefined in the API payload. */
    parentId: z.string().uuid("Parent category id must be a valid UUID").or(z.literal("")),
  });

export type CategoryFormValues = z.infer<typeof categoryFormSchema>;

export const CATEGORY_FORM_DEFAULTS: CategoryFormValues = {
  name: "",
  slug: "",
  description: "",
  parentId: "",
};

export function slugifyCategoryName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

export function toCategoryPayload(values: CategoryFormValues) {
  const description = values.description.trim();
  const parentId = values.parentId.trim();
  return {
    name: values.name,
    slug: values.slug,
    description: description.length > 0 ? description : undefined,
    parentId: parentId.length > 0 ? parentId : undefined,
  };
}
