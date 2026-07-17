import { z } from "zod";

const organizationIdSchema = z.string().uuid("Organization id must be a valid UUID");

const organizationNameSchema = z
  .string()
  .trim()
  .min(1, "Name is required")
  .max(200, "Name must be at most 200 characters");

const organizationSlugSchema = z
  .string()
  .trim()
  .min(1, "Slug is required")
  .max(100, "Slug must be at most 100 characters")
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Slug must contain lowercase letters, numbers, and hyphens only",
  );

export const organizationIdParamSchema = z.object({
  id: organizationIdSchema,
});

export const updateOrganizationSchema = z
  .object({
    name: organizationNameSchema.optional(),
    slug: organizationSlugSchema.optional(),
  })
  .refine((data) => data.name !== undefined || data.slug !== undefined, {
    message: "At least one field must be provided",
  });

export type OrganizationIdParam = z.infer<typeof organizationIdParamSchema>;
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;
