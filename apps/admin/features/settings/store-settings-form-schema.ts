import { z } from "zod";

/** UI form schema aligned with shared updateStoreSettingsSchema field rules. */
export const storeSettingsFormSchema = z.object({
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
  defaultCurrency: z
    .string()
    .trim()
    .length(3, "Currency must be a 3-letter ISO code")
    .regex(/^[A-Z]{3}$/, "Currency must be uppercase ISO 4217 code"),
  defaultTimezone: z
    .string()
    .trim()
    .min(1, "Timezone is required")
    .max(100, "Timezone must be at most 100 characters"),
  locale: z
    .string()
    .trim()
    .min(2, "Locale is required")
    .max(35, "Locale must be at most 35 characters")
    .regex(
      /^[a-z]{2}(?:-[A-Z]{2})?$/,
      "Locale must use the form ll or ll-RR (e.g. en or en-US)",
    ),
});

export type StoreSettingsFormValues = z.infer<typeof storeSettingsFormSchema>;

export function toStoreSettingsPayload(values: StoreSettingsFormValues) {
  return {
    name: values.name,
    slug: values.slug,
    defaultCurrency: values.defaultCurrency,
    defaultTimezone: values.defaultTimezone,
    locale: values.locale,
  };
}
