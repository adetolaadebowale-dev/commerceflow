import { createBrandSchema } from "@commerceflow/validation";
import { z } from "zod";

/** UI form schema derived from shared createBrandSchema (no storeId). */
export const brandFormSchema = createBrandSchema
  .omit({ storeId: true })
  .extend({
    description: z
      .string()
      .trim()
      .max(2000, "Description must be at most 2000 characters"),
  });

export type BrandFormValues = z.infer<typeof brandFormSchema>;

export const BRAND_FORM_DEFAULTS: BrandFormValues = {
  name: "",
  slug: "",
  description: "",
};

export function slugifyBrandName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

export function toBrandPayload(values: BrandFormValues) {
  const description = values.description.trim();
  return {
    name: values.name,
    slug: values.slug,
    description: description.length > 0 ? description : undefined,
  };
}
