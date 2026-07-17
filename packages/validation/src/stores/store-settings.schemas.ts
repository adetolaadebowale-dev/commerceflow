import { z } from "zod";

const storeIdSchema = z.string().uuid("Store id must be a valid UUID");

const storeNameSchema = z
  .string()
  .trim()
  .min(1, "Name is required")
  .max(200, "Name must be at most 200 characters");

const storeSlugSchema = z
  .string()
  .trim()
  .min(1, "Slug is required")
  .max(100, "Slug must be at most 100 characters")
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Slug must contain lowercase letters, numbers, and hyphens only",
  );

const currencySchema = z
  .string()
  .trim()
  .length(3, "Currency must be a 3-letter ISO code")
  .regex(/^[A-Z]{3}$/, "Currency must be uppercase ISO 4217 code");

const timezoneSchema = z
  .string()
  .trim()
  .min(1, "Timezone is required")
  .max(100, "Timezone must be at most 100 characters");

const localeSchema = z
  .string()
  .trim()
  .min(2, "Locale is required")
  .max(35, "Locale must be at most 35 characters")
  .regex(
    /^[a-z]{2}(?:-[A-Z]{2})?$/,
    "Locale must use the form ll or ll-RR (e.g. en or en-US)",
  );

export const storeIdParamSchema = z.object({
  id: storeIdSchema,
});

export const updateStoreSettingsSchema = z
  .object({
    name: storeNameSchema.optional(),
    slug: storeSlugSchema.optional(),
    defaultCurrency: currencySchema.optional(),
    defaultTimezone: timezoneSchema.optional(),
    locale: localeSchema.optional(),
  })
  .refine(
    (data) =>
      data.name !== undefined ||
      data.slug !== undefined ||
      data.defaultCurrency !== undefined ||
      data.defaultTimezone !== undefined ||
      data.locale !== undefined,
    { message: "At least one field must be provided" },
  );

export type StoreIdParam = z.infer<typeof storeIdParamSchema>;
export type UpdateStoreSettingsInput = z.infer<typeof updateStoreSettingsSchema>;
