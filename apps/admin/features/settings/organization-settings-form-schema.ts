import { z } from "zod";

/** UI form schema aligned with shared updateOrganizationSchema field rules. */
export const organizationSettingsFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(200, "Name must be at most 200 characters"),
  slug: z
    .string()
    .trim()
    .min(1, "Slug is required")
    .max(100, "Slug must be at most 100 characters")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must contain lowercase letters, numbers, and hyphens only",
    ),
});

export type OrganizationSettingsFormValues = z.infer<
  typeof organizationSettingsFormSchema
>;

export function toOrganizationSettingsPayload(
  values: OrganizationSettingsFormValues,
) {
  return {
    name: values.name,
    slug: values.slug,
  };
}
